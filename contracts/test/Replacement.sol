
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "../library/ArrayUtils.sol";

contract Replacement {
    function replace(bytes memory data, bytes memory desired, bytes memory mask) external pure returns(bytes memory) {
        return ArrayUtils.guardedArrayReplace(data, desired, mask);
    }
}