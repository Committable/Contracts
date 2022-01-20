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
        returns (bytes memory)
    {
        require(
            controller.isApproved(msg.sender) == true || msg.sender == user,
            "invalid request"
        );
        (bool success, bytes memory returndata) = target.call(data);

        if (success) {
            return returndata;
        } else {
            // Look for revert reason and bubble it up if present
            if (returndata.length > 0) {
                // The easiest way to bubble the revert reason is using memory via assembly

                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert('low level call failed');
            }
        }
    }
}
