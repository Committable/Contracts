// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../library/OrderUtils.sol";
import "../library/ArrayUtils.sol";
import "../library/ECDSA.sol";

contract Debugger {
    function hashOrder(OrderUtils.Order memory order)
        external
        pure
        returns (bytes32)
    {
        return OrderUtils.hash(order);
    }

    function recover(bytes32 orderHash, bytes memory sig)
        external
        pure
        returns (address)
    {
        return ECDSA.recover(orderHash, sig);
    }

     function replace(
        bytes memory data,
        bytes memory desired,
        bytes memory mask
    ) external pure returns (bytes memory) {
        return ArrayUtils.guardedArrayReplace(data, desired, mask);
    }
}
