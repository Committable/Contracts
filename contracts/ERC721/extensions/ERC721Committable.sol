// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../Controller.sol";
import "../../library/ECDSA.sol";
import "./IERC721Committable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "../../Router.sol";

contract ERC721Committable is ERC721EnumerableUpgradeable, IERC721Committable {
    Controller internal _controller;
    // mapping from project to tokenIds belongging to this project
    mapping(uint96 => uint256[]) private _projectTokens;
    // mapping from address to nounce to avoid reuse of approval
    mapping(address => uint256) public nonces;

    // solhint-disable-next-line
    function __ERC721Committable_init_unchained(address controller)
        internal
        initializer
    {
        _controller = Controller(controller);
    }

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
            interfaceId == type(IERC721Committable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function mint(
        address to,
        uint256 tokenId,
        bytes memory signature
    ) external virtual override {
        require(
            ECDSA.recover(bytes32(tokenId), signature) ==
                _controller.getSigner(),
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

    function permit(
        address operator,
        uint256 tokenId,
        uint256 deadline,
        bytes memory signature
    ) external virtual override {
        require(
            deadline == 0 || block.timestamp < deadline,
            "expired permit signature"
        );
        address owner = ownerOf(tokenId);
        bytes32 permitHash = keccak256(
            abi.encode(operator, tokenId, nonces[owner]++, deadline)
        );
        require(
            ECDSA.recover(permitHash, signature) == owner,
            "invalid permit signature"
        );
        _approve(operator, tokenId);
    }

    uint256[47] private __gap;
}
