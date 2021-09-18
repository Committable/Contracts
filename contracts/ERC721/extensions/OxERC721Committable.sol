// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OxERC721Tradable.sol";
import "../../Controller.sol";
import "../../library/LibCommitInfo.sol";
import "../../library/LibSignature.sol";
import "./OxIERC721Committable.sol";

contract OxERC721Committable is OxERC721Tradable, OxIERC721Committable {
    // address to sign commitInfo
    address private _signer;
    // mapping from tokenId to project
    mapping(uint256 => string) private _project;
    // mapping from project to tokenIds belongging to this project
    mapping(string => uint256[]) private _projectTokens;
    // mapping from tokenId to commits
    mapping(uint256 => bytes20[]) private _commits;
    // mapping from commit to tokenId
    mapping(bytes20 => uint256) private _commitsToken;

    // solhint-disable-next-line
    function __ERC721Committable_init_unchained(address signer)
        internal
        initializer
    {
        _signer = signer;
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
            interfaceId == type(OxIERC721Committable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function changeSigner(address signer) external virtual override {
        require(msg.sender == _signer);
        _signer = signer;
    }

    function getSigner() external virtual override view returns(address) {
        return _signer;
    }

    function mint(
        address to,
        uint256 tokenId,
        LibCommitInfo.CommitInfo memory commitInfo,
        bytes memory signature
    ) external virtual override {
        require(
            LibSignature.recover(LibCommitInfo.hash(commitInfo), signature) ==
                _signer,
            "commitInfo signature validation failed"
        );

        require(commitInfo.commits.length > 0, "at least register 1 commit");
        for (uint256 i = 0; i < commitInfo.commits.length; ++i) {
            bytes20 commit = commitInfo.commits[i];
            require(_commitsToken[commit] == 0, "commit has been registered");
            _commitsToken[commit] = tokenId;
        }

        _project[tokenId] = commitInfo.project;
        _projectTokens[commitInfo.project].push(tokenId);

        _commits[tokenId] = commitInfo.commits;
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
        returns (string memory)
    {
        return _project[tokenId];
    }

    /**
     * @dev Returns tokenId of a project at a given index
     */
    function tokenOfProjectByIndex(string memory project, uint256 index)
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
    function totalSupplyOfProject(string memory project)
        external
        view
        virtual
        override
        returns (uint256)
    {
        return _projectTokens[project].length;
    }

    /**
     * @dev Returns commit of a tokenId at a given index
     */
    function commitOfTokenByIndex(uint256 tokenId, uint256 index)
        external
        view
        virtual
        override
        returns (bytes20)
    {
        return _commits[tokenId][index];
    }

    /**
     * @dev Returns tokenId of commit
     */
    function tokenOfCommit(bytes20 commit)
        external
        view
        virtual
        override
        returns (uint256)
    {
        return _commitsToken[commit];
    }

    /**
     * @dev Returns commit supply of a given tokenId
     */
    function commitSupplyOfToken(uint256 tokenId)
        external
        view
        virtual
        override
        returns (uint256)
    {
        return _commits[tokenId].length;
    }

    uint256[46] private __gap;
}
