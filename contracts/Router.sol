// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Controller.sol";

contract Router {
    Controller public controller;

    constructor(address _address) {
        controller = Controller(_address);
    }

    /**
     * @dev forward calldata on behalf of token owner
     */
    function proxy(address target, bytes memory data)
        external
        returns (bool result)
    {
        require(
            controller.isApproved(msg.sender) == true,
            "exchange not approved"
        );
        (result, data) = target.call(data);
        return result;
    }
}
