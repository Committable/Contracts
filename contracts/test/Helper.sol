// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../library/OrderUtils.sol";
import "../library/ECDSA.sol";
import "../ERC721/CommittableV1.sol";

contract Helper {
    function hashOrder(OrderUtils.Order memory order)
        external
        pure
        returns (bytes32)
    {
        return OrderUtils.hash(order);
    }

    function recover(bytes32 hash, bytes memory sig)
        external
        pure
        returns (address)
    {
        return ECDSA.recover(hash, sig);
    }

    function toSignedMessage(bytes32 hash) external pure returns (bytes32) {
        return ECDSA.toEthSignedMessageHash(hash);
    }
}
