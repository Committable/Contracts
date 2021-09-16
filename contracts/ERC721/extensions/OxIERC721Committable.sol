// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721EnumerableUpgradeable.sol";
import "../../library/LibCommitInfo.sol";
import "../../library/LibSignature.sol";

interface OxIERC721Committable is IERC721EnumerableUpgradeable {
    // function transferFrom(
    //     address from,
    //     address to,
    //     uint256 tokenId,
    //     LibCommitInfo.CommitInfo memory commitInfo,
    //     bytes memory signature
    // ) external;

    function mint(
        address to,
        uint256 tokenId,
        LibCommitInfo.CommitInfo memory commitInfo,
        bytes memory signature
    ) external;

    /**
     * @dev Returns project of a given tokenId
     */
    function projectOf(uint256 tokenId) external view returns (string memory);

    /**
     * @dev Returns total supply of a given project
     */
    function totalSupplyOfProject(string memory project)
        external
        view
        returns (uint256);

    /**
     * @dev Returns tokenId of a project at a given index
     */
    function tokenOfProjectByIndex(string memory project, uint256 index)
        external
        view
        returns (uint256);

    /**
     * @dev Returns commit supply of a given tokenId
     */
    function commitSupplyOfToken(uint256 tokenId)
        external
        view
        returns (uint256);

    /**
     * @dev Returns commit of a tokenId at a given index
     */
    function commitOfTokenByIndex(uint256 tokenId, uint256 index)
        external
        view
        returns (bytes20);

    /**
     * @dev Returns tokenId of commit
     */
    function tokenOfCommit(bytes20 commit) external view returns (uint256);
}
