// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./extensions/IERC721Committable.sol";

interface ICommittableV1 is IERC721Committable {
    function initialize(
        string memory _name,
        string memory _symbol,
        address _controller
    ) external;
}
