// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./OrderUtils.sol";
import "./FeePanel.sol";
import "../Controller.sol";
import "./TransferProxy.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Exchange is ReentrancyGuard, FeePanel {
    // solhint-disable-next-line
    bytes32 public DOMAIN_SEPARATOR;

    string public name = "Exchange";
    mapping(bytes32 => bool) private _isCancelledOrFinished;
    Controller _controller;
    event OrderMatched(
        bytes32 buyOrderHash,
        bytes32 sellOrderHash,
        address indexed buyer,
        address indexed seller,
        address paymentToken,
        uint256 value,
        uint256 royalty,
        address royaltyRecipient
    );

    event OrderCancelled(bytes32 orderHash, address indexed maker);

    constructor(address _address) {
        _controller = Controller(_address);
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
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
            "Exchange: invalid request"
        );
        _isCancelledOrFinished[OrderUtils.hash(order)] = true;
        emit OrderCancelled(OrderUtils.hash(order), msg.sender);
    }

    /**
     * @dev check whether given order is cancelled/finished or not
     * @param order - order to check
     */
    function checkOrderStatus(OrderUtils.Order memory order)
        external
        view
        returns (bool)
    {
        return (!_isCancelledOrFinished[OrderUtils.hash(order)]);
    }

    /**
     * @dev support transfer unminted tokens with token signature
     */
    function transferERC721(
        address to,
        address contractAddress,
        uint256 tokenId,
        bytes memory tokenSig
    ) external {
        _transferERC721(msg.sender, to, contractAddress, tokenId, tokenSig);
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
            _orderSigValidation(buyOrder, buyOrderSig) &&
                _orderSigValidation(sellOrder, sellOrderSig),
            "Exchange: invalid order signature"
        );
        require(
            _orderParamsValidation(buyOrder, sellOrder),
            "Exchange: invalid order parameters"
        );
        require(
            _canSettle(buyOrder, sellOrder),
            "Exchange: must be called by legit user"
        );
        _beforeTransfer(buyOrder, sellOrder);
        _transferPaymentToken(buyOrder, sellOrder);
        _transferERC721(
            sellOrder.maker,
            buyOrder.maker,
            sellOrder.target,
            sellOrder.tokenId,
            sellOrder.tokenSig
        );
    }

    /**
     * @dev check order signatures
     */
    function _orderSigValidation(
        OrderUtils.Order memory order,
        bytes memory signature
    ) internal view returns (bool) {
        if (signature.length != 65) {
            revert("Exchange: invalid signature length");
        }

        // Divide the signature in r, s and v variables
        bytes32 r;
        bytes32 s;
        uint8 v;

        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }
        // compute digest according to eip712
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                OrderUtils.hash(order)
            )
        );
        return (ecrecover(digest, v, r, s) == order.maker);
    }

    /**
     * @dev validate order parameters
     */
    function _orderParamsValidation(
        OrderUtils.Order memory buyOrder,
        OrderUtils.Order memory sellOrder
    ) internal view returns (bool) {
        return (// must match order side
        (buyOrder.isBuySide == true && sellOrder.isBuySide == false) &&
            // must match order type
            (buyOrder.isAuction == sellOrder.isAuction) &&
            // must match paymentToken
            (buyOrder.paymentToken == sellOrder.paymentToken) &&
            // buy order value must large or equal to sell order value
            (buyOrder.value >= sellOrder.value) &&
            // // royaltyRecipient must match
            // (buyOrder.royaltyRecipient == sellOrder.royaltyRecipient) &&
            // // royalty must match
            // (buyOrder.royalty == sellOrder.royalty) &&
            // royalty must be a rational value
            (sellOrder.royalty <= 1000) &&
            // must match target
            (buyOrder.target == sellOrder.target) &&
            // must match tokenId
            (buyOrder.tokenId == sellOrder.tokenId) &&
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
     * @dev make change to order status
     */
    function _beforeTransfer(
        OrderUtils.Order memory buyOrder,
        OrderUtils.Order memory sellOrder
    ) internal {
        _isCancelledOrFinished[OrderUtils.hash(buyOrder)] = true;
        _isCancelledOrFinished[OrderUtils.hash(sellOrder)] = true;
    }

    /**
     * @dev check whether the transaction is made by legit user
     */
    function _canSettle(
        OrderUtils.Order memory buyOrder,
        OrderUtils.Order memory sellOrder
    ) internal view returns (bool) {
        // in fixed-price orders, only buyer can match order
        // in auction orders, only seller can match order
        if (buyOrder.isAuction) {
            return msg.sender == sellOrder.maker;
        } else {
            return msg.sender == buyOrder.maker;
        }
    }

    /**
     * @dev transfer payment token from buyer to seller
     */
    function _transferPaymentToken(
        OrderUtils.Order memory buyOrder,
        OrderUtils.Order memory sellOrder
    ) internal {
        address royaltyRecipient = sellOrder.royaltyRecipient;
        address paymentToken = sellOrder.paymentToken;
        uint256 fee = (buyOrder.value * _fee) / 10000;
        uint256 royalty = (buyOrder.value * sellOrder.royalty) / 10000;
        uint256 remainValue = buyOrder.value - fee - royalty;
        // pay by ether
        if (paymentToken == address(0)) {
            require(
                !buyOrder.isAuction && msg.value == buyOrder.value,
                "Exchange: invalid payment"
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
            require(msg.value == 0, "Exchange: invalid payment");
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
            buyOrder.value,
            sellOrder.royalty,
            sellOrder.royaltyRecipient
        );
    }

    /**
     * @dev trigger state transition (message call to router)
     */
    function _transferERC721(
        address from,
        address to,
        address contractAddress,
        uint256 tokenId,
        bytes memory tokenSig
    ) internal {
        address transferProxy = _controller.getTransferProxy();
        bytes memory data;
        // mint first if tokenSig provided
        // keccak256(0x00) = 0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a
        if (
            keccak256(tokenSig) !=
            0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a
        ) {
            // mint token to the seller
            data = abi.encodeWithSignature(
                "mint(address,uint256,bytes)",
                from,
                tokenId,
                tokenSig
            );
            // success = TransferProxy(transferProxy).proxy(contractAddress, data);
            // require(success, "Exchange: transferProxy call failed");
            TransferProxy(transferProxy).proxy(contractAddress, data);
        }
        // standard ERC721 transfer from seller to buyer
        data = abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            from,
            to,
            tokenId
        );
        // success = TransferProxy(transferProxy).proxy(contractAddress, data);
        // require(success, "Exchange: transferProxy call failed");
        TransferProxy(transferProxy).proxy(contractAddress, data);
    }
}
