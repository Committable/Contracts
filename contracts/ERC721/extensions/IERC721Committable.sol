// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "../../library/ECDSA.sol";

interface IERC721Committable is IERC721Upgradeable {

    function mint(
        address to,
        uint256 tokenId,
        bytes memory signature
    ) external;

    function totalSupply() external returns (uint256);
}
