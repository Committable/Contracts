// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OxERC721Tradable.sol";
import "../../Controller.sol";
import "../../library/LibCommitInfo.sol";
import "../../library/LibSignature.sol";
import "./OxIERC721Committable.sol";

contract OxERC721Committable is OxERC721Tradable, OxIERC721Committable {
    // mapping from project to tokenIds belongging to this project
    mapping(uint96 => uint256[]) private _projectTokens;

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return
            interfaceId == type(OxIERC721Committable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function mint(
        address to,
        uint256 tokenId,
        bytes memory signature
    ) external virtual override {
        require(
            LibSignature.recover(bytes32(tokenId), signature) ==
                _controller.signer(),
            "invalid token signature"
        );
        uint96 project = uint96(tokenId >> 160);
        _projectTokens[project].push(tokenId);
        _mint(to, tokenId);
    }

    /**
     * @dev Returns project of a given tokenId
     */
    function projectOf(uint256 tokenId)
        external
        view
        virtual
        override
        returns (uint96)
    {
        return uint96(tokenId >> 160);
    }

    /**
     * @dev Returns tokenId of a project at a given index
     */
    function tokenOfProjectByIndex(uint96 project, uint256 index)
        external
        view
        virtual
        override
        returns (uint256)
    {
        return _projectTokens[project][index];
    }

    /**
     * @dev Returns token supply of a given project
     */
    function totalSupplyOfProject(uint96 project)
        external
        view
        virtual
        override
        returns (uint256)
    {
        return _projectTokens[project].length;
    }

    /**
     * @dev Returns commit of a tokenId  
     */
    function commitOf(uint256 tokenId)
        external
        view
        virtual
        override
        returns (uint160)
    {
        return uint160(tokenId);
    }

    uint256[49] private __gap;
}
