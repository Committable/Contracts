// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library OrderUtils {
    struct Order {
        // exchange address to execute orders
        address exchange;
        // order side: true for order from buyer, false for order from seller
        bool isBuySide;
        // order maker address
        address maker;
        // order taker address, if specified
        address taker;
        // paymentToken contract address, zero-address as sentinal value for ether
        address paymentToken;
        // paymentToken amount that a buyer is willing to pay, or a seller's minimal ask price
        uint256 value;
        // royalty address to pay
        address royaltyRecipient;
        // royalty to pay, zero as non-royalty
        uint256 royalty;
        // target to call
        address target;
        // attached calldata to target
        bytes data;
        // data replacement pattern, empty bytes for no replacement;
        bytes replacementPattern;
        // timestamp for the starting time for executing this order
        uint256 start;
        // timestamp for the deadline for executing this order
        uint256 end;
        // randomize order hash
        uint256 salt;
    }

    function hash(Order memory order) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    order.exchange,
                    order.isBuySide,
                    order.maker,
                    order.taker,
                    order.paymentToken,
                    order.value,
                    order.royaltyRecipient,
                    order.royalty,
                    order.target,
                    order.data,
                    order.replacementPattern,
                    order.start,
                    order.end,
                    order.salt
                )
            );
    }
}
