// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../library/OrderUtils.sol";
import "../library/ECDSA.sol";
import "../library/ArrayUtils.sol";
import "./FeePanel.sol";
import "../Controller.sol";
import "../Router.sol";
import "../ERC721/CommittableV1.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Exchange is ReentrancyGuard, FeePanel {
    mapping(bytes32 => bool) private _isCancelledOrFinished;
    Controller _controller;
    event OrderMatched(
        bytes32 buyOrderHash,
        bytes32 sellOrderHash,
        address indexed buyer,
        address indexed seller,
        address paymentToken,
        uint256 value
    );

    event OrderCancelled(bytes32 orderHash, address indexed maker);

    constructor(address _address) {
        _controller = Controller(_address);
    }

    /**
     * @dev cancel an order permanently
     * @param order - the order to be cancelled
     * Requirements:
     * - The `msg.sender` must be the order maker.
     *
     * Emits an {OrderCancelled} event.
     */
    function cancelOrder(OrderUtils.Order memory order) external {
        require(
            order.maker == msg.sender &&
                _isCancelledOrFinished[OrderUtils.hash(order)] == false,
            "invalid request"
        );
        _isCancelledOrFinished[OrderUtils.hash(order)] = true;
        emit OrderCancelled(OrderUtils.hash(order), msg.sender);
    }

    /**
     * @dev check whether given order is cancelled/finished or not
     * @param orderHash - the hash value of order to check
     */
    function checkOrderStatus(bytes32 orderHash) external view returns (bool) {
        if (!_isCancelledOrFinished[orderHash]) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev check whether given orders are cancelled/finished or not
     * @param orderHashs - the hash value array of orders to check
     */
    function checkOrderStatusBatch(bytes32[] memory orderHashs)
        external
        view
        returns (bool[] memory)
    {
        bool[] memory bools = new bool[](orderHashs.length);
        for (uint256 i = 0; i < orderHashs.length; ++i) {
            if (!_isCancelledOrFinished[orderHashs[i]]) {
                bools[i] = true;
            } else {
                bools[i] = false;
            }
        }
        return bools;
    }

    /**
     * @dev match orders, transfer tokens and trigger state transition
     * @param buyOrder - buy order struct
     * @param buyOrderSig - buy order signature (must be signed by buy order maker)
     * @param sellOrder - sell order struct
     * @param sellOrderSig - - buy order signature (must be signed by sell order maker)
     * - buy order and sell order must pass signature verification
     * - buy order and sell order params must match with each other
     * - Emits an {orderMatched} event.
     */
    function matchOrder(
        OrderUtils.Order memory buyOrder,
        bytes memory buyOrderSig,
        OrderUtils.Order memory sellOrder,
        bytes memory sellOrderSig
    ) external payable nonReentrant {
        require(
            _orderSigValidation(buyOrder, buyOrderSig, sellOrder, sellOrderSig),
            "invalid order signature"
        );
        require(
            _orderParamsValidation(buyOrder, sellOrder),
            "invalid order parameters"
        );
        _beforeTransfer(buyOrder, sellOrder);
        _transferToken(buyOrder, sellOrder);
        _transitState(buyOrder, sellOrder);
    }

    /**
     * @dev check order signatures
     */
    function _orderSigValidation(
        OrderUtils.Order memory buyOrder,
        bytes memory buyOrderSig,
        OrderUtils.Order memory sellOrder,
        bytes memory sellOrderSig
    ) internal pure returns (bool) {
        bytes32 buyOrderHash = OrderUtils.hash(buyOrder);
        bytes32 sellOrderHash = OrderUtils.hash(sellOrder);
        return (ECDSA.recover(buyOrderHash, buyOrderSig) == buyOrder.maker &&
            ECDSA.recover(sellOrderHash, sellOrderSig) == sellOrder.maker);
    }

    /**
     * @dev validate order parameters
     */
    function _orderParamsValidation(
        OrderUtils.Order memory buyOrder,
        OrderUtils.Order memory sellOrder
    ) internal view returns (bool) {
        return ((buyOrder.exchange == address(this)) &&
            (sellOrder.exchange == address(this)) &&
            // must be opposite order side
            (buyOrder.isBuySide == true && sellOrder.isBuySide == false) &&
            // must be valid taker
            (buyOrder.taker == address(0) ||
                buyOrder.taker == sellOrder.maker) &&
            // must be valid taker
            (sellOrder.taker == address(0) ||
                sellOrder.taker == buyOrder.maker) &&
            // must match paymentToken
            (buyOrder.paymentToken == sellOrder.paymentToken) &&
            // buyOrder value must be larger than sellOrder
            (buyOrder.value >= sellOrder.value) &&
            // royaltyRecipient must match
            (buyOrder.royaltyRecipient == sellOrder.royaltyRecipient) &&
            // royalty must match
            (buyOrder.royalty == sellOrder.royalty) &&
            // royalty must be a rational value
            ((buyOrder.royalty + _fee) < 10000) &&
            // must match target
            (buyOrder.target == sellOrder.target) &&
            // must reach start time
            (buyOrder.start < block.timestamp &&
                sellOrder.start < block.timestamp) &&
            // buyOrder must not expire
            (buyOrder.end > block.timestamp || buyOrder.end == 0) &&
            // sellOrder must not expire
            (sellOrder.end > block.timestamp || sellOrder.end == 0) &&
            // must be executable
            (_isCancelledOrFinished[OrderUtils.hash(buyOrder)] == false &&
                _isCancelledOrFinished[OrderUtils.hash(sellOrder)] == false));
    }

    /**
     * @dev set order status
     */
    function _beforeTransfer(
        OrderUtils.Order memory buyOrder,
        OrderUtils.Order memory sellOrder
    ) internal {
        _isCancelledOrFinished[OrderUtils.hash(buyOrder)] = true;
        _isCancelledOrFinished[OrderUtils.hash(sellOrder)] = true;
    }

    /**
     * @dev transfer payment token from buyer to seller
     */
    function _transferToken(
        OrderUtils.Order memory buyOrder,
        OrderUtils.Order memory sellOrder
    ) internal {
        address royaltyRecipient = buyOrder.royaltyRecipient;
        address paymentToken = buyOrder.paymentToken;
        uint256 fee = (buyOrder.value / 10000) * _fee;
        uint256 royalty = (buyOrder.value / 10000) * buyOrder.royalty;
        uint256 remainValue = buyOrder.value - fee - royalty;
        // pay by ether
        if (paymentToken == address(0)) {
            require(
                msg.sender == buyOrder.maker && msg.value == buyOrder.value,
                "invalid payment"
            );
            // transfer fee
            if (fee != 0) {
                payable(_recipient).transfer(fee);
            }
            // transfer royalty
            if (royalty != 0) {
                payable(royaltyRecipient).transfer(royalty);
            }
            // transfer remain value to seller
            if (remainValue != 0) {
                payable(sellOrder.maker).transfer(remainValue);
            }
        }
        // pay by erc20
        else {
            require(msg.value == 0, "invalid payment");
            // transfer fee
            if (fee != 0) {
                SafeERC20.safeTransferFrom(
                    IERC20(paymentToken),
                    buyOrder.maker,
                    _recipient,
                    fee
                );
            }
            // transfer royalty
            if (royalty != 0 && royaltyRecipient != address(0)) {
                SafeERC20.safeTransferFrom(
                    IERC20(paymentToken),
                    buyOrder.maker,
                    royaltyRecipient,
                    royalty
                );
            }
            // transfer remain value to seller
            if (remainValue != 0) {
                SafeERC20.safeTransferFrom(
                    IERC20(paymentToken),
                    buyOrder.maker,
                    sellOrder.maker,
                    remainValue
                );
            }
        }

        emit OrderMatched(
            OrderUtils.hash(buyOrder),
            OrderUtils.hash(sellOrder),
            buyOrder.maker,
            sellOrder.maker,
            buyOrder.paymentToken,
            buyOrder.value
        );
    }

    /**
     * @dev trigger state transition (message call to router) if buy order data match sell order data after replacement
     */
    function _transitState(
        OrderUtils.Order memory buyOrder,
        OrderUtils.Order memory sellOrder
    ) internal {
        bytes memory buyOrderData = ArrayUtils.guardedArrayReplace(
            buyOrder.data,
            sellOrder.data,
            buyOrder.replacementPattern
        );
        bytes memory sellOrderData = ArrayUtils.guardedArrayReplace(
            sellOrder.data,
            buyOrder.data,
            sellOrder.replacementPattern
        );
        require(
            keccak256(buyOrderData) == keccak256(sellOrderData),
            "invalid data replacement"
        );
        address router = _controller.getRouter(sellOrder.maker);
        Router(router).proxy(sellOrder.target, sellOrderData);
    }
}
