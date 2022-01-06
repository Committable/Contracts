// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Controller.sol";

contract Router {
    address public user;
    Controller public controller;

    constructor(address controller_, address user_) {
        controller = Controller(controller_);
        user = user_;
    }

    /**
     * @dev forward calldata on behalf of token owner
     */
    function proxy(address target, bytes memory data)
        external
        returns (bool result)
    {
        require(
            controller.isApproved(msg.sender) == true || msg.sender == user,
            "invalid request"
        );
        (result, data) = target.call(data);
        // assembly {
        //     returndatacopy(0, 0, returndatasize())
        //      switch result
        //     // delegatecall returns 0 on error.
        //     case 0 {
        //         revert(0, returndatasize())
        //     }
        //     default {
        //         return(0, returndatasize())
        //     }
        // }
        return result;
    }
}
