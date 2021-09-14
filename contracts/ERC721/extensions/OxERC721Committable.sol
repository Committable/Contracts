// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OxERC721Tradable.sol";
import "../../Controller.sol";
import "../../library/LibCommitInfo.sol";
import "../../library/LibSignature.sol";
import "./OxIERC721Committable.sol";

contract OxERC721Committable is OxERC721Tradable, OxIERC721Committable {
    // mapping from tokenId to creator
    mapping(uint256 => address) private _creator;
    // mapping from creator to tokenIds this address created
    mapping(address => uint256[]) private _creatorTokens;
    // mapping from tokenId to project
    mapping(uint256 => string) private _project;
    // mapping from project to tokenIds belongging to this project
    mapping(string => uint256[]) private _projectTokens;
    // mapping from tokenId to commits
    mapping(uint256 => bytes20[]) private _commits;
    // mapping from commit to tokenId
    mapping(bytes20 => uint256) private _commitsToken;

    function mint(
        address to,
        uint256 tokenId,
        LibCommitInfo.CommitInfo memory commitInfo,
        bytes memory signature
    ) external virtual override {
        require(
            LibSignature.recover(LibCommitInfo.hash(commitInfo), signature) ==
                _controller.signer(),
            "commitInfo signature validation failed"
        );

        for (uint256 i = 0; i < commitInfo.commits.length; ++i) {
            bytes20 commit = commitInfo.commits[i];
            require(_commitsToken[commit] == 0, "commit has been registered");
            _commitsToken[commit] = tokenId;
        }
        _creator[tokenId] = to;
        _creatorTokens[to].push(tokenId);

        // _project[tokenId] = commitInfo.project;
        _projectTokens[commitInfo.project].push(tokenId);

        _commits[tokenId] = commitInfo.commits;
        _mint(to, tokenId);
    }

    /**
     * @dev Returns creator of a given tokenId
     */
    function creatorOf(uint256 tokenId)
        external
        view
        virtual
        override
        returns (address)
    {
        return _creator[tokenId];
    }

    /**
     * @dev Returns tokenId of a creator at a given index
     */
    function tokenOfCreatorByIndex(address creator, uint256 index)
        external
        view
        virtual
        override
        returns (uint256)
    {
        return _creatorTokens[creator][index];
    }

    /**
     * @dev Returns token supply of a given creator
     */
    function totalSupplyOfCreator(address creator)
        external
        view
        virtual
        override
        returns (uint256)
    {
        return _creatorTokens[creator].length;
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

    uint256[44] private __gap;
}
