// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../library/LibOrder.sol";
import "../library/LibSignature.sol";
import "../library/LibCommitInfo.sol";
import "./SigCheck.sol";
import "./FeePanel.sol";
import "../Controller.sol";
import "../Router.sol";
import "../ERC721/OxIERC721Upgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange is ReentrancyGuard, SigCheck, FeePanel {
    mapping(bytes32 => bool) private _isCancelledOrFinished;

    Controller _controller;

    event OrderMatched(
        bytes32 buySideOrderHash,
        bytes32 sellSideOrderHash,
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
    function cancelOrder(LibOrder.Order memory order) external {
        require(
            order.signer == msg.sender,
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
     * @dev match orders and transfer, the function currently only supports matching ETH, ERC20 buySideOrder with ERC721 sellSideOrder
     * Requirements:
     * - buy order and sell order must pass signature verification
     * - buy order and sell order params must match with each other
     * - The 'msg.sender' must be one of the order signer according to transaction type
     * - Emits an {orderMatched} event.
     */
    function matchAndTransfer(
        LibOrder.Order memory buySideOrder,
        bytes memory buySideOrderSig,
        LibOrder.Order memory sellSideOrder,
        bytes memory sellSideOrderSig
    ) external payable nonReentrant {
        _orderSigValidation(
            buySideOrder,
            buySideOrderSig,
            sellSideOrder,
            sellSideOrderSig
        );
        _orderParamsValidation(buySideOrder, sellSideOrder);
        _transferSellSideAsset(buySideOrder, sellSideOrder);
        _transferBuySideAsset(buySideOrder, sellSideOrder);
        _afterTransfer(buySideOrder, sellSideOrder);
    }

    /**
     * @dev match orders and mint ERC721 to buyer, this function only supports Committable ERC721
     */
    function matchAndMint(
        LibOrder.Order memory buySideOrder,
        bytes memory buySideOrderSig,
        LibOrder.Order memory sellSideOrder,
        bytes memory sellSideOrderSig,
        LibCommitInfo.CommitInfo memory commitInfo,
        bytes memory commitInfoSig
    ) external payable nonReentrant {
        _orderSigValidation(
            buySideOrder,
            buySideOrderSig,
            sellSideOrder,
            sellSideOrderSig
        );
        _orderParamsValidation(buySideOrder, sellSideOrder);
        _transferSellSideAsset(
            buySideOrder,
            sellSideOrder,
            commitInfo,
            commitInfoSig
        );
        _transferBuySideAsset(buySideOrder, sellSideOrder);
        _afterTransfer(buySideOrder, sellSideOrder);
    }

    function _orderSigValidation(
        LibOrder.Order memory buySideOrder,
        bytes memory buySideOrderSig,
        LibOrder.Order memory sellSideOrder,
        bytes memory sellSideOrderSig
    ) internal pure {
        bytes32 buySideOrderHash = LibOrder.hash(buySideOrder);
        bytes32 sellSideOrderHash = LibOrder.hash(sellSideOrder);

        require(
            LibSignature.recover(buySideOrderHash, buySideOrderSig) ==
                buySideOrder.signer,
            "buySideOrder signature validation failed"
        );
        require(
            LibSignature.recover(sellSideOrderHash, sellSideOrderSig) ==
                sellSideOrder.signer,
            "sellSideOrder signature validation failed"
        );
    }

    function _orderParamsValidation(
        LibOrder.Order memory buySideOrder,
        LibOrder.Order memory sellSideOrder
    ) internal view {
        require(
            buySideOrder.exchange == address(this) &&
                sellSideOrder.exchange == address(this),
            "order does not match exchange address"
        );
        require(
            buySideOrder.isBuySide == true && sellSideOrder.isBuySide == false,
            "order buy/sell side does not match"
        );
        require(
            buySideOrder.isAuction == sellSideOrder.isAuction,
            "order transaction type does not match"
        );
        if (buySideOrder.isAuction == true) {
            require(
                msg.sender == sellSideOrder.signer,
                "auction transaction must be executed by the seller"
            );
        } else {
            require(
                msg.sender == buySideOrder.signer,
                "fixed-price transaction must be executed by the buyer"
            );
        }
        // buySideAsset match
        require(
            buySideOrder.buySideAsset.assetClass ==
                sellSideOrder.buySideAsset.assetClass,
            "buySideAsset assetClass does not match"
        );
        require(
            buySideOrder.buySideAsset.contractAddress ==
                sellSideOrder.buySideAsset.contractAddress,
            "buySideAsset contractAddress does not match"
        );
        require(
            buySideOrder.buySideAsset.amountOrId >=
                sellSideOrder.buySideAsset.amountOrId,
            "buySideOrder bid price must be no less than the seller ask price"
        );
        // sellSideAsset match
        require(
            buySideOrder.sellSideAsset.assetClass ==
                sellSideOrder.sellSideAsset.assetClass,
            "sellSideAsset assetClass does not match"
        );
        require(
            buySideOrder.sellSideAsset.contractAddress ==
                sellSideOrder.sellSideAsset.contractAddress,
            "sellSideAsset contractAddress does not match"
        );
        require(
            buySideOrder.sellSideAsset.amountOrId ==
                sellSideOrder.sellSideAsset.amountOrId,
            "sellSideAsset tokenId does not amtch"
        );
        // other validations
        require(
            buySideOrder.start < block.timestamp &&
                sellSideOrder.start < block.timestamp,
            "either order has not started"
        );
        require(
            buySideOrder.end > block.timestamp &&
                sellSideOrder.end > block.timestamp,
            "either order has expired"
        );
        require(
            _isCancelledOrFinished[LibOrder.hash(buySideOrder)] == false &&
                _isCancelledOrFinished[LibOrder.hash(sellSideOrder)] == false,
            "either order has been cancelled or finishd"
        );
    }

    // transfer sellSideAsset that has not yet minted
    function _transferSellSideAsset(
        LibOrder.Order memory buySideOrder,
        LibOrder.Order memory sellSideOrder,
        LibCommitInfo.CommitInfo memory commitInfo,
        bytes memory commitInfoSig
    ) internal {
        // bytes4(keccak256("ERC721")) = 0x73ad2146
        require(
            buySideOrder.sellSideAsset.assetClass == 0x73ad2146,
            "invalid sellSideAsset type: only support ERC721 now"
        );
        address nftContract = sellSideOrder.sellSideAsset.contractAddress;
        uint256 tokenId = sellSideOrder.sellSideAsset.amountOrId;
        address royaltyRecipient = sellSideOrder.signer;
        // mint nft to buyer
        OxIERC721Upgradeable(nftContract).mint(
            buySideOrder.signer,
            tokenId,
            commitInfo,
            commitInfoSig
        );
        // register royaltyRecipient if not set
        if (_royaltyRecipient[nftContract][tokenId] == address(0)) {
            _setRoyaltyRecipient(nftContract, tokenId, royaltyRecipient);
        }
    }

    // transfer ERC721 from seller to buyer, and register royaltyRecipient address if not set
    function _transferSellSideAsset(
        LibOrder.Order memory buySideOrder,
        LibOrder.Order memory sellSideOrder
    ) internal {
        // bytes4(keccak256("ERC721")) = 0x73ad2146
        require(
            buySideOrder.sellSideAsset.assetClass == 0x73ad2146,
            "invalid sellSideAsset type: only support ERC721 now"
        );
        address nftContract = sellSideOrder.sellSideAsset.contractAddress;
        uint256 tokenId = sellSideOrder.sellSideAsset.amountOrId;
        address royaltyRecipient = sellSideOrder.signer;
        // deliver nft to buyer
        Router router = Router(_controller.router());
        router.transferERC721(
            nftContract,
            sellSideOrder.signer,
            buySideOrder.signer,
            tokenId
        );
        // register royaltyRecipient if not set
        if (_royaltyRecipient[nftContract][tokenId] == address(0)) {
            _royaltyRecipient[nftContract][tokenId] = royaltyRecipient;
        }
    }

    function _transferBuySideAsset(
        LibOrder.Order memory buySideOrder,
        LibOrder.Order memory sellSideOrder
    ) internal {
        address nftContract = buySideOrder.sellSideAsset.contractAddress;
        address tokenContract = buySideOrder.buySideAsset.contractAddress;
        uint256 tokenId = buySideOrder.sellSideAsset.amountOrId;
        // pay by ether (fixed-price only)
        // bytes4(keccak256("ETH")) = 0xaaaebeba
        if (buySideOrder.buySideAsset.assetClass == 0xaaaebeba) {
            require(
                buySideOrder.isAuction == false,
                "invalid orders: ETH not allowed in auction"
            );
            require(
                msg.value == buySideOrder.buySideAsset.amountOrId,
                "ether amount does not match buy order value"
            );
            uint256 fee = (buySideOrder.buySideAsset.amountOrId / 10000) * _fee;
            uint256 royalty = (buySideOrder.buySideAsset.amountOrId / 10000) *
                _royalty[nftContract][tokenId];
            // transfer fee
            if (fee != 0) {
                payable(_recipient).transfer(fee);
            }
            // transfer royalty
            if (
                royalty != 0 &&
                _royaltyRecipient[nftContract][tokenId] != address(0)
            ) {
                payable(_royaltyRecipient[nftContract][tokenId]).transfer(
                    royalty
                );
            }
            // transfer remainValue to the seller, solidity above 0.8.0 will take underflow check
            uint256 remainValue = buySideOrder.buySideAsset.amountOrId -
                fee -
                royalty;
            if (remainValue != 0) {
                payable(sellSideOrder.signer).transfer(remainValue);
            }
        }
        // pay by erc20 (non-auction and auction)
        // bytes4(keccak256("ERC20")) = 0x8ae85d84
        else if (buySideOrder.buySideAsset.assetClass == 0x8ae85d84) {
            require(msg.value == 0, "sending ether not allowed in ERC20 order");
            uint256 fee = (buySideOrder.buySideAsset.amountOrId / 10000) * _fee;
            uint256 royalty = (buySideOrder.buySideAsset.amountOrId / 10000) *
                _royalty[nftContract][tokenId];
            // transfer fee
            if (fee != 0) {
                SafeERC20.safeTransferFrom(
                    IERC20(tokenContract),
                    buySideOrder.signer,
                    _recipient,
                    fee
                );
            }
            // transfer royalty
            if (
                royalty != 0 &&
                _royaltyRecipient[nftContract][tokenId] != address(0)
            ) {
                SafeERC20.safeTransferFrom(
                    IERC20(tokenContract),
                    buySideOrder.signer,
                    _royaltyRecipient[nftContract][tokenId],
                    royalty
                );
            }
            // transfer remainValue to the seller, solidity above 0.8.0 will take underflow check
            uint256 remainValue = buySideOrder.buySideAsset.amountOrId -
                fee -
                royalty;
            if (remainValue != 0) {
                SafeERC20.safeTransferFrom(
                    IERC20(tokenContract),
                    buySideOrder.signer,
                    sellSideOrder.signer,
                    remainValue
                );
            }
        } else {
            revert("invalid asset type");
        }

        emit OrderMatched(
            LibOrder.hash(buySideOrder),
            LibOrder.hash(sellSideOrder),
            buySideOrder.signer,
            sellSideOrder.signer,
            sellSideOrder.sellSideAsset.amountOrId,
            sellSideOrder.isAuction,
            buySideOrder.buySideAsset.assetClass,
            buySideOrder.buySideAsset.contractAddress,
            buySideOrder.buySideAsset.amountOrId
        );
    }

    function _afterTransfer(
        LibOrder.Order memory buySideOrder,
        LibOrder.Order memory sellSideOrder
    ) internal {
        _isCancelledOrFinished[LibOrder.hash(buySideOrder)] = true;
        _isCancelledOrFinished[LibOrder.hash(sellSideOrder)] = true;
        // if the signer of the sellSide order is royalty recipient, he can update the royalty after transaction
        address nftContract = sellSideOrder.sellSideAsset.contractAddress;
        uint256 tokenId = sellSideOrder.sellSideAsset.amountOrId;
        uint256 royalty = sellSideOrder.royalty;
        if (
            sellSideOrder.signer == _royaltyRecipient[nftContract][tokenId] &&
            _royalty[nftContract][tokenId] != royalty
        ) {
            _changeRoyalty(nftContract, tokenId, royalty);
        }
    }
}
