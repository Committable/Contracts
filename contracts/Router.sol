// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Controller.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ERC721/CommittableV1.sol";

contract Router {
    Controller public controller;

    constructor(address _address) {
        controller = Controller(_address);
    }

    /**
     * @dev Transfer Committable ERC721 with permit signature, approve and make transfer in single transaction
     */
    function transferWithPermit(
        address token,
        address from,
        address to,
        uint256 tokenId,
        uint256 deadline,
        bytes memory signature
    ) external {
        CommittableV1(token).permit(
            address(this),
            tokenId,
            deadline,
            signature
        );
        CommittableV1(token).transferFrom(from, to, tokenId);
    }

    /**
     * @dev Mint Committable ERC721 with token signature
     */
    function mintWithSig(
        address token,
        address to,
        uint256 tokenId,
        bytes memory signature
    ) external {
        CommittableV1(token).mint(to, tokenId, signature);
    }

    /**
     * @dev Transfer standard ERC721 token, this contract must be approved first
     */
    function transferFrom(
        address token,
        address from,
        address to,
        uint256 tokenId
    ) external {
        CommittableV1(token).transferFrom(from, to, tokenId);
    }
}
