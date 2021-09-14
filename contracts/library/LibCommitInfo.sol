// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library LibCommitInfo {
    struct CommitInfo {
        string project;
        bytes20[] commits;
    }

    function hash(CommitInfo memory commitInfo)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(commitInfo.project, commitInfo.commits));
    }
}
