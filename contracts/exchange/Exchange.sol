// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./LibOrder.sol";
import "./LibSignature.sol";
import "./SigCheck.sol";
import "./FeePanel.sol";
import "../ProxyController.sol";
import "../TransferProxy.sol";
import "../ERC721/IOxERC721Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Exchange is ReentrancyGuard, SigCheck, FeePanel {
    mapping(bytes32 => bool) private isCancelledOrFinished;

    ProxyController proxyController;

    event orderMatched(LibOrder.Order buyOrder, LibOrder.Order sellOrder);
    event orderCancelled(LibOrder.Order, address indexed maker);

    constructor(address _address) {
        proxyController = ProxyController(_address);
    }

    /**
     * @dev cancel an order permanently
     * @param order - the order to be cancelled
     * Requirements:
     * - The `msg.sender` must be the order maker.
     *
     * Emits an {orderCancelled} event.
     */
    function cancelOrder(LibOrder.Order memory order) external {
        require(
            order.maker == msg.sender,
            "order must be cancelled by its maker"
        );
        isCancelledOrFinished[LibOrder.hash(order)] = true;
        emit orderCancelled(order, msg.sender);
    }

    /**
     * @dev check whether given order is cancelled or finished
     * @param order - the order to check
     */
    function checkOrderStatus(LibOrder.Order memory order)
        external
        view
        returns (bool)
    {
        if (!isCancelledOrFinished[LibOrder.hash(order)]) {
            return true;
        } else {
            return false;
        }
    }
    /**
     * @dev match orders and execute
     * Requirements:
     * - buy order and sell order must pass signature verification
     * - buy order and sell order must match with each other
     * - The 'msg.sender' must be order maker according to transaction type
     * Emits an {orderMatched} event.
     */
    function matchAndExecuteOrder(
        LibOrder.Order memory buyOrder,
        bytes memory buyOrderSig,
        LibOrder.Order memory sellOrder,
        bytes memory sellOrderSig
    ) external payable nonReentrant {
        _signatureValidation(buyOrder, buyOrderSig, sellOrder, sellOrderSig);
        _orderValidation(buyOrder, sellOrder);
        _executeOrder(buyOrder, sellOrder);
        _afterExecute(buyOrder, sellOrder);
    }

    function _signatureValidation(
        LibOrder.Order memory buyOrder,
        bytes memory buyOrderSig,
        LibOrder.Order memory sellOrder,
        bytes memory sellOrderSig
    ) internal pure {
        bytes32 buyOrderHash = LibOrder.hash(buyOrder);
        bytes32 sellOrderHash = LibOrder.hash(sellOrder);

        require(
            LibSignature.recover(buyOrderHash, buyOrderSig) == buyOrder.maker,
            "buyOrder signature validation failed"
        );
        require(
            LibSignature.recover(sellOrderHash, sellOrderSig) ==
                sellOrder.maker,
            "sellOrder signature validation failed"
        );
    }

    function _orderValidation(
        LibOrder.Order memory buyOrder,
        LibOrder.Order memory sellOrder
    ) internal view {
        require(
            buyOrder.exchange == address(this) &&
                sellOrder.exchange == address(this),
            "order does does not match exchange address"
        );
        require(
            buyOrder.isBuyer == true && sellOrder.isBuyer == false,
            "order buy/sell side does not match"
        );
        require(
            buyOrder.isAuction == sellOrder.isAuction,
            "order transaction type does not match"
        );
        if (buyOrder.isAuction == true) {
            require(
                msg.sender == sellOrder.maker,
                "auction transaction must be executed by the seller"
            );
        } else {
            require(
                msg.sender == buyOrder.maker,
                "non-auction transaction must be executed by the buyer"
            );
        }
        require(
            buyOrder.buyAsset.assetClass == sellOrder.buyAsset.assetClass,
            "order buyAsset assetClass does not match"
        );
        require(
            buyOrder.buyAsset.contractAddress ==
                sellOrder.buyAsset.contractAddress,
            "order buyAsset contractAddress does not match"
        );
        require(
            buyOrder.buyAsset.value >= sellOrder.buyAsset.value,
            "buyOrder bid price must be no less than the seller's ask price"
        );
        require(
            buyOrder.nftAsset.contractAddress ==
                sellOrder.nftAsset.contractAddress,
            "order NFT contractAddress does not match"
        );
        require(
            buyOrder.nftAsset.tokenId == sellOrder.nftAsset.tokenId,
            "order tokenId does not match"
        );
        require(
            buyOrder.end >= block.timestamp && sellOrder.end >= block.timestamp,
            "either order has expired"
        );
        require(
            isCancelledOrFinished[LibOrder.hash(buyOrder)] == false &&
                isCancelledOrFinished[LibOrder.hash(sellOrder)] == false,
            "either order has been cancelled or finishd"
        );
    }

    function _afterExecute(
        LibOrder.Order memory buyOrder,
        LibOrder.Order memory sellOrder
    ) internal {
        isCancelledOrFinished[LibOrder.hash(buyOrder)] = true;
        isCancelledOrFinished[LibOrder.hash(sellOrder)] = true;
        // if the seller of the nft is creator, he can change the patent fee rate
        address creator = IOxERC721Upgradeable(
            sellOrder.nftAsset.contractAddress
        ).creatorOf(sellOrder.nftAsset.tokenId);
        if (sellOrder.maker == creator) {
            _changePatentFee(
                sellOrder.nftAsset.contractAddress,
                sellOrder.nftAsset.tokenId,
                sellOrder.nftAsset.patentFee
            );
        }

        emit orderMatched(buyOrder, sellOrder);
    }

    function _executeOrder(
        LibOrder.Order memory buyOrder,
        LibOrder.Order memory sellOrder
    ) internal {
        address nftContract = sellOrder.nftAsset.contractAddress;
        address tokenContract = buyOrder.buyAsset.contractAddress;
        uint256 tokenId = sellOrder.nftAsset.tokenId;
        address creator = IOxERC721Upgradeable(nftContract).creatorOf(tokenId);
        uint256 amountToPay = buyOrder.buyAsset.value;
        uint256 patentFee = patentFeeOf[nftContract][tokenId];
        // pay by ether (non-auction only)
        if (buyOrder.buyAsset.assetClass == bytes4(keccak256("ETH"))) {
            require(
                msg.value == amountToPay,
                "ether amount does not match buy order value"
            );
            uint256 remainValue = amountToPay;
            // transfer platform fee
            if (platformFee != 0) {
                uint256 _platformFee = (amountToPay / 10000) * platformFee;
                payable(recipient).transfer(_platformFee);
                remainValue = amountToPay - _platformFee;
            }
            // transfer patent fee
            if (patentFee != 0) {
                uint256 _patentFee = (amountToPay / 10000) * patentFee;
                payable(IOxERC721Upgradeable(nftContract).creatorOf(tokenId))
                    .transfer(_patentFee);
                remainValue = remainValue - _patentFee;
            }
            if (remainValue != 0) {
                // transfer asset to the seller
                sellOrder.maker.transfer(remainValue);
            }
        }
        //  pay by erc20 (non-auction and auction)
        else if (buyOrder.buyAsset.assetClass == bytes4(keccak256("ERC20"))) {
            require(msg.value == 0, "sending ether not allowed in ERC20 order");
            uint256 remainValue = amountToPay;
            // transfer platform fee
            if (platformFee != 0) {
                uint256 _platformFee = (amountToPay / 10000) * platformFee;
                SafeERC20.safeTransferFrom(
                    IERC20(tokenContract),
                    buyOrder.maker,
                    recipient,
                    _platformFee
                );
                remainValue = amountToPay - _platformFee;
            }
            // transfer patent fee
            if (patentFee != 0) {
                uint256 _patentFee = (amountToPay / 10000) * patentFee;
                SafeERC20.safeTransferFrom(
                    IERC20(tokenContract),
                    buyOrder.maker,
                    creator,
                    _patentFee
                );
                remainValue = remainValue - _patentFee;
            }
            if (remainValue != 0) {
                // transfer token to the seller
                SafeERC20.safeTransferFrom(
                    IERC20(tokenContract),
                    buyOrder.maker,
                    sellOrder.maker,
                    remainValue
                );
            }
        } else {
            revert("unauthenticated asset type not allowed");
        }

        // deliver nft
        TransferProxy(proxyController.transferProxy()).safeTransferFrom(
            sellOrder.nftAsset.contractAddress,
            sellOrder.maker,
            buyOrder.maker,
            sellOrder.nftAsset.tokenId
        );
    }
}
