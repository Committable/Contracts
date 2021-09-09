// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./LibOrder.sol";
import "./LibSignature.sol";
import "./SigCheck.sol";
import "./FeePanel.sol";
import "../ProxyController.sol";
import "../TransferProxy.sol";
import "../ERC721/OxIERC721Upgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Exchange is ReentrancyGuard, SigCheck, FeePanel {
    mapping(bytes32 => bool) private _isCancelledOrFinished;

    ProxyController _proxyController;

    event OrderMatched(
        bytes32 buyOrderHash,
        bytes32 sellOrderHash,
        address indexed buyer,
        address indexed seller,
        uint256 indexed tokenId,
        bool isAuction,
        bytes4 assetClass,
        address contractAddress,
        uint256 price
    );

    event OrderCancelled(bytes32 orderHash, address indexed maker);

    constructor(address _address) {
        _proxyController = ProxyController(_address);
    }

    /**
     * @dev cancel an order permanently
     * @param order - the order to be cancelled
     * Requirements:
     * - The `msg.sender` must be the order maker.
     *
     * Emits an {OrderCancelled} event.
     */
    function cancelOrder(LibOrder.Order memory order) external {
        require(
            order.maker == msg.sender,
            "order must be cancelled by its maker"
        );
        _isCancelledOrFinished[LibOrder.hash(order)] = true;
        emit OrderCancelled(LibOrder.hash(order), msg.sender);
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
     * @dev match orders and execute
     * Requirements:
     * - buy order and sell order must pass signature verification
     * - buy order and sell order must match with each other
     * - The 'msg.sender' must be one of the order maker according to transaction type
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
            "buyOrder bid price must be no less than the seller ask price"
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
            buyOrder.start < block.timestamp &&
                sellOrder.start < block.timestamp,
            "either order has not started"
        );
        require(
            buyOrder.end > block.timestamp && sellOrder.end > block.timestamp,
            "either order has expired"
        );
        require(
            _isCancelledOrFinished[LibOrder.hash(buyOrder)] == false &&
                _isCancelledOrFinished[LibOrder.hash(sellOrder)] == false,
            "either order has been cancelled or finishd"
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
    }

    function _executeOrder(
        LibOrder.Order memory buyOrder,
        LibOrder.Order memory sellOrder
    ) internal {
        address nftContract = sellOrder.nftAsset.contractAddress;
        address tokenContract = buyOrder.buyAsset.contractAddress;
        uint256 tokenId = sellOrder.nftAsset.tokenId;

        TransferProxy transferProxy = TransferProxy(
            _proxyController.transferProxy()
        );
        // pay by ether (non-auction only)
        // bytes4(keccak256("ETH")) = 0xaaaebeba
        if (buyOrder.buyAsset.assetClass == 0xaaaebeba) {
            require(
                buyOrder.isAuction == false,
                "invalid orders: ETH not allowed in auction"
            );
            require(
                msg.value == buyOrder.buyAsset.value,
                "ether amount does not match buy order value"
            );
            uint256 platformFee = (buyOrder.buyAsset.value / 10000) *
                _platformFee;
            uint256 patentFee = (buyOrder.buyAsset.value / 10000) *
                _patentFeeOf[nftContract][tokenId];
            // transfer platform fee
            if (platformFee != 0) {
                payable(_recipient).transfer(platformFee);
            }
            // transfer patent fee
            if (patentFee != 0) {
                payable(OxIERC721Upgradeable(nftContract).creatorOf(tokenId))
                    .transfer(patentFee);
            }
            // transfer remainValue to the seller, solidity above 0.8.0 will take underflow check
            uint256 remainValue = buyOrder.buyAsset.value -
                platformFee -
                patentFee;
            if (remainValue != 0) {
                sellOrder.maker.transfer(remainValue);
            }
        }
        //  pay by erc20 (non-auction and auction)
        // bytes4(keccak256("ERC20")) = 0x8ae85d84
        else if (buyOrder.buyAsset.assetClass == 0x8ae85d84) {
            require(msg.value == 0, "sending ether not allowed in ERC20 order");
            uint256 platformFee = (buyOrder.buyAsset.value / 10000) *
                _platformFee;
            uint256 patentFee = (buyOrder.buyAsset.value / 10000) *
                _patentFeeOf[nftContract][tokenId];
            // transfer platform fee
            if (platformFee != 0) {
                transferProxy.transferERC20(
                    tokenContract,
                    buyOrder.maker,
                    _recipient,
                    platformFee
                );
            }
            // transfer patent fee
            if (patentFee != 0) {
                transferProxy.transferERC20(
                    tokenContract,
                    buyOrder.maker,
                    OxIERC721Upgradeable(nftContract).creatorOf(tokenId),
                    patentFee
                );
            }
            // transfer remainValue to the seller, solidity above 0.8.0 will take underflow check
            uint256 remainValue = buyOrder.buyAsset.value -
                platformFee -
                patentFee;
            if (remainValue != 0) {
                transferProxy.transferERC20(
                    tokenContract,
                    buyOrder.maker,
                    sellOrder.maker,
                    remainValue
                );
            }
        } else {
            revert("unauthenticated asset type not allowed");
        }

        // deliver nft
        transferProxy.transferERC721(
            sellOrder.nftAsset.contractAddress,
            sellOrder.maker,
            buyOrder.maker,
            sellOrder.nftAsset.tokenId
        );
        emit OrderMatched(
            LibOrder.hash(buyOrder),
            LibOrder.hash(sellOrder),
            buyOrder.maker,
            sellOrder.maker,
            sellOrder.nftAsset.tokenId,
            sellOrder.isAuction,
            buyOrder.buyAsset.assetClass,
            buyOrder.buyAsset.contractAddress,
            buyOrder.buyAsset.value
        );
    }

    function _afterExecute(
        LibOrder.Order memory buyOrder,
        LibOrder.Order memory sellOrder
    ) internal {
        _isCancelledOrFinished[LibOrder.hash(buyOrder)] = true;
        _isCancelledOrFinished[LibOrder.hash(sellOrder)] = true;
        // if the seller of the nft is creator, he can change the patent fee rate
        address creator = OxIERC721Upgradeable(
            sellOrder.nftAsset.contractAddress
        ).creatorOf(sellOrder.nftAsset.tokenId);
        if (sellOrder.maker == creator) {
            _changePatentFee(
                sellOrder.nftAsset.contractAddress,
                sellOrder.nftAsset.tokenId,
                sellOrder.nftAsset.patentFee
            );
        }
    }
}
