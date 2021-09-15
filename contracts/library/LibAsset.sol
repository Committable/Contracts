// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library LibAsset {
    bytes4 public constant ETH_ASSET_CLASS = bytes4(keccak256("ETH"));
    bytes4 public constant ERC20_ASSET_CLASS = bytes4(keccak256("ERC20"));
    bytes4 public constant ERC721_ASSET_CLASS = bytes4(keccak256("ERC721"));

    struct Asset {
        // assetClass to imply the type of this asset
        bytes4 assetClass;
        // contractAddress of ERC20 or ERC721, unused for ETH
        address contractAddress;
        // amount of asset for ETH or ERC20, unused for ERC721
        uint256 amount;
        // tokenId of ERC721, unused for ERC20 or ETH
        uint256 tokenId;
        // creator of ERC721, unused for ERC20 or ETH
        address creator;
    }


    function hash(Asset memory asset) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(asset.assetClass, asset.contractAddress, asset.value)
            );
    }

}
