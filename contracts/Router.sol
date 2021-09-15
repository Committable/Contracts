// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Controller.sol";
import "./library/LibCommitInfo.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ERC721/OxIERC721Upgradeable.sol";

contract Router {
    mapping(address => bool) public isDisabled;
    Controller public controller;
    event ProxyDisabled(address indexed _address, bool _bool);

    constructor(address _address) {
        controller = Controller(_address);
    }

    /**
     * @dev mint and transfer ERC721
     * mint and transfer ERC721 onbehalf of user
     */
    function transferERC721(
        address token,
        address from,
        address to,
        uint256 tokenId,
        LibCommitInfo.CommitInfo memory commitInfo,
        bytes memory signature
    ) external {
        OxIERC721Upgradeable(token).mint(from, tokenId, commitInfo, signature);
        _transferERC721(token, from, to, tokenId);
    }

    /**
     * @dev transfer ERC721
     * transfer ERC721 onbehalf of user
     */
    function transferERC721(
        address token,
        address from,
        address to,
        uint256 tokenId
    ) external {
        _transferERC721(token, from, to, tokenId);
    }

    /**
     * @dev transfer ERC721
     * internal function to transfer ERC721 onbehalf of user, this function can only be accessed only when the msg.sender is the owner
     * or registered exchange (and owner allows this type of transaction)
     */
    function _transferERC721(
        address token,
        address from,
        address to,
        uint256 tokenId
    ) internal {
        require(
            ((controller.contracts(msg.sender)) && !isDisabled[from]) ||
                OxIERC721Upgradeable(token).ownerOf(tokenId) == msg.sender,
            "invalid sender: must be token owner or registered address"
        );
        OxIERC721Upgradeable(token).safeTransferFrom(from, to, tokenId);
    }


    /**
     * @dev transfer ERC20
     * transfer ERC20 onbehalf of user, implement SafeERC20: will throw when transferFrom function reverts or return false
     */
    function transferERC20(
        address _token,
        address _from,
        address _to,
        uint256 amount
    ) external {
        SafeERC20.safeTransferFrom(IERC20(_token), _from, _to, amount);
    }

    /**
     * @dev Allow user to manage their proxy status
     * @param _bool, transferProxy is disabled when the _bool is set to true
     */
    function disable(bool _bool) external {
        isDisabled[msg.sender] = _bool;
        emit ProxyDisabled(msg.sender, _bool);
    }

    /**
     * @dev Returns token IDs at a given arrary of `index` of user owned tokends stored by token contract
     */
    /**
     * @dev Returns token IDs owned by `owner` at a given array of `index` of its token list.
     */
    function tokenOfOwnerByIndexBatch(
        address _token,
        address owner,
        uint256[] memory indexes
    ) external view virtual returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](indexes.length);
        for (uint256 i = 0; i < indexes.length; ++i) {
            tokenIds[i] = OxIERC721Upgradeable(_token).tokenOfOwnerByIndex(
                owner,
                indexes[i]
            );
        }
        return tokenIds;
    }

    /**
     * @dev Returns token IDs at a given arrary of `index` of all the tokens stored by token contract.
     */
    function tokenByIndexBatch(address _token, uint256[] memory indexes)
        external
        view
        virtual
        returns (uint256[] memory)
    {
        uint256[] memory tokenIds = new uint256[](indexes.length);
        for (uint256 i = 0; i < indexes.length; ++i) {
            tokenIds[i] = OxIERC721Upgradeable(_token).tokenByIndex(indexes[i]);
        }
        return tokenIds;
    }
}
