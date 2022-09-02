// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ERC721/ERC721Committable.sol";

contract Router {
    address public erc721Committable;

    constructor(address _erc721Committable) {
        erc721Committable = _erc721Committable;
    }

    struct Payroll {
        uint256 tokenId;
        uint96 reward;
    }

     /**
     * @dev Batch fund ERC721 
     */
    function batchFund(Payroll[] memory payroll) external payable {
        for (uint256 i=0;i<payroll.length;i++) {
            ERC721Committable(erc721Committable).fund{value: payroll[i].reward}(payroll[i].tokenId);
        }
    }
}
