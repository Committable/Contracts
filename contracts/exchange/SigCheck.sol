// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../library/LibOrder.sol";
import "../library/LibSignature.sol";

contract SigCheck {
    // functions in this contract are for test only, they do not perform any roles in production

    function getAssetHash(LibAsset.Asset memory asset)
        external
        pure
        returns (bytes32)
    {
        return LibAsset.hash(asset);
    }

    function getOrderHash(LibOrder.Order memory order)
        external
        pure
        returns (bytes32)
    {
        return LibOrder.hash(order);
    }

    function getRecover(LibOrder.Order memory order, bytes memory signature)
        external
        pure
        returns (address)
    {
        return LibSignature.recover(LibOrder.hash(order), signature);
    }
}
