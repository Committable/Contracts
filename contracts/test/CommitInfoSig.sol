// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../library/LibCommitInfo.sol";
import "../library/LibSignature.sol";

contract CommitInfoSig {
    function recover(
        LibCommitInfo.CommitInfo memory commitInfo,
        bytes memory signature
    ) external pure returns (address) {
        bytes32 hashValue = LibCommitInfo.hash(commitInfo);
        return LibSignature.recover(hashValue, signature);
    }

    function hash(LibCommitInfo.CommitInfo memory commitInfo)
        external
        pure
        returns (bytes32)
    {
        return LibCommitInfo.hash(commitInfo);
    }
}
