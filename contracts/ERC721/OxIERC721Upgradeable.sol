// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "./extensions/OxIERC721EnumerableUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721EnumerableUpgradeable.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, optional enumeration extension
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 */
interface OxIERC721Upgradeable is IERC721EnumerableUpgradeable {
    function initialize(
        string memory _name,
        string memory _symbol,
        address _proxyController
    ) external;

    function safeMint(address to, uint256 tokenId) external;

    function safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) external;

    function creatorOf(uint256 tokenId) external view returns (address);
}
