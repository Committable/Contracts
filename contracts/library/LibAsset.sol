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
        // amount for ETH or ERC20, tokenId for ERC721
        uint256 value;
    }

    function hash(Asset memory asset) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(asset.assetClass, asset.contractAddress, asset.value)
            );
    }
}
