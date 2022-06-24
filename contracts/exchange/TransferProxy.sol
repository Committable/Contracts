// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Controller.sol";

/**
 * this contract owns token transfer approvement of all users, the caller that allowed to call this contract must
 * be able to verifiy the legitimacy of the transaction
 */
contract TransferProxy {
    Controller public controller;

    constructor(address controller_) {
        controller = Controller(controller_);
    }

    /**
     * @dev forward calldata on behalf of token owner
     */
    function proxy(address target, bytes memory data)
        external
        returns (bytes memory)
    {
        require(
            controller.isApproved(msg.sender) == true,
            "TransferProxy: caller not registered"
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
                revert("low level call failed");
            }
        }
    }
}
