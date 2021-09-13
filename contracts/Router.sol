// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Controller.sol";
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

    function transferERC721(
        address _token,
        address _from,
        address _to,
        uint256 tokenId
    ) external {
        require(!isDisabled[_from], "token owner has disabled router");
        require(
            controller.contracts(msg.sender),
            "only registered address can visit this proxy"
        );
        OxIERC721Upgradeable(_token).safeTransferFrom(_from, _to, tokenId);
    }

    function transferERC20(
        address _token,
        address _from,
        address _to,
        uint256 amount
    ) external {
        require(
            controller.contracts(msg.sender),
            "only registered address can visit this proxy"
        );
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

        function creatorOfBatch(address _token, uint256[] memory tokenIds)
        external
        view
        virtual
        returns (address[] memory)
    {
        address[] memory batchCreators = new address[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; ++i) {
            batchCreators[i] = OxIERC721Upgradeable(_token).creatorOf(tokenIds[i]);
        }

        return batchCreators;
    }
}
