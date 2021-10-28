// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721EnumerableUpgradeable.sol";
import "../../library/ECDSA.sol";

interface IERC721Committable is IERC721EnumerableUpgradeable {
    function mint(
        address to,
        uint256 tokenId,
        bytes memory signature
    ) external;

    /**
     * @dev Returns project of a given tokenId
     */
    function projectOf(uint256 tokenId) external view returns (uint96);

    /**
     * @dev Returns total supply of a given project
     */
    function totalSupplyOfProject(uint96 project)
        external
        view
        returns (uint256);

    /**
     * @dev Returns tokenId of a project at a given index
     */
    function tokenOfProjectByIndex(uint96 project, uint256 index)
        external
        view
        returns (uint256);

    /**
     * @dev Returns commit supply of a given tokenId
     */
    function commitOf(uint256 tokenId) external view returns (uint160);

    function permit(
        address operator,
        uint256 tokenId,
        uint256 deadline,
        bytes memory signature
    ) external;
}
