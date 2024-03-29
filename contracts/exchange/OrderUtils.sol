// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library OrderUtils {
    struct Order {
        // order side: true for order from buyer, false for order from seller
        bool isBuySide;
        // order transaction type
        bool isAuction;
        // order maker address
        address maker;
        // // paymentToken contract address, zero-address as sentinal value for ether
        address paymentToken;
        // paymentToken amount that a buyer is willing to pay, or a seller's minimal ask price
        uint256 value;
        // royalty address to pay
        address royaltyRecipient;
        // royalty to pay, zero as non-royalty
        uint256 royalty;
        // contract address to call
        address target;
        // tokenId to transfer
        uint256 tokenId;
        // timestamp for the beginning for executing this order
        uint256 start;
        // timestamp for the deadline for executing this order
        uint256 end;
        // randomize order hash
        uint256 salt;
    }

    // keccak256("Order(bool isBuySide,bool isAuction,address maker,address paymentToken,uint256 value,address royaltyRecipient,uint256 royalty,address target,uint256 tokenId,bytes tokenSig,uint256 start,uint256 end,uint256 salt)")
    // bytes32 ORDER_TYPEHASH = 0x27032b6564c9c203f2bd0f0ccd36b2529e0811ecf18a68db0e2c9c09315bd252;
    function hash(Order memory order) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    // keccak256("Order(bool isBuySide,bool isAuction,address maker,address paymentToken,uint256 value,address royaltyRecipient,uint256 royalty,address target,uint256 tokenId,uint256 start,uint256 end,uint256 salt)"),
                    bytes32(
                        0x0e6d10e3410480287f7da74700fffd3978667772bdd833a68a905a27645320d1
                    ),
                    order.isBuySide,
                    order.isAuction,
                    order.maker,
                    order.paymentToken,
                    order.value,
                    order.royaltyRecipient,
                    order.royalty,
                    order.target,
                    order.tokenId,
                    order.start,
                    order.end,
                    order.salt
                )
            );
    }
}
