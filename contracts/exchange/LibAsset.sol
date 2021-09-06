// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library LibAsset {
    bytes4 public constant ETH_ASSET_CLASS = bytes4(keccak256("ETH"));
    bytes4 public constant ERC20_ASSET_CLASS = bytes4(keccak256("ERC20"));
    bytes4 public constant ERC721_ASSET_CLASS = bytes4(keccak256("ERC721"));
    bytes4 public constant ERC1155_ASSET_CLASS = bytes4(keccak256("ERC1155"));

    struct Asset {
        bytes4 assetClass;
        address contractAddress;
        uint256 value;
    }

    struct NFT {
        address contractAddress;
        uint256 tokenId;
        uint256 patentFee;
    }

    function hash(Asset memory asset) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(asset.assetClass, asset.contractAddress, asset.value)
            );
    }

    function hash(NFT memory nft) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(nft.contractAddress, nft.tokenId, nft.patentFee)
            );
    }
}
