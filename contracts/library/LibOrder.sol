// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./LibAsset.sol";

library LibOrder {
    struct Order {
        address exchange;
        bool isBuyer; // true for buy order, false for sell order
        bool isAuction; //true for auction, false for fixed price
        address payable maker;
        LibAsset.Asset buyAsset;
        LibAsset.NFT nftAsset;
        uint256 salt;
        uint256 start;
        uint256 end;
    }

    function hash(Order memory order) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    order.exchange,
                    order.isBuyer, // true for buy order, false for sell order
                    order.isAuction, //true for auction, false ofr direct pay
                    order.maker,
                    LibAsset.hash(order.buyAsset),
                    LibAsset.hash(order.nftAsset),
                    order.salt,
                    order.start,
                    order.end
                )
            );
    }
}
