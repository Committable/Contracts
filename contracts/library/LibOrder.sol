// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./LibAsset.sol";

library LibOrder {
    struct Order {
        // exchange address to execute orders
        address exchange;
        // order side: true for order from buyer, false for order from seller
        bool isBuySide;
        // order type: true for auction, false for fixed price
        bool isAuction;
        // order signer address
        address signer;
        // order buyside asset:
        LibAsset.Asset buySideAsset;
        // order sellside asset:
        LibAsset.Asset sellSideAsset;
        // royalty to update
        uint256 royalty;
        // random value
        uint256 salt;
        // timestamp for the starting time for executing this order
        uint256 start;
        // timestamp for the deadline for executing this order
        uint256 end;
    }

    function hash(Order memory order) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    order.exchange,
                    order.isBuySide,
                    order.isAuction,
                    order.signer,
                    LibAsset.hash(order.buySideAsset),
                    LibAsset.hash(order.sellSideAsset),
                    order.royalty,
                    order.salt,
                    order.start,
                    order.end
                )
            );
    }
}
