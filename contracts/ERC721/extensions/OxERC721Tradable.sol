// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "../../Controller.sol";
import "../../Router.sol";

contract OxERC721Tradable is ERC721EnumerableUpgradeable {
    Controller _controller;

    // solhint-disable-next-line
    function __ERC721Tradable_init_unchained(address controller)
        internal
        initializer
    {
        _controller = Controller(controller);
    }

    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool)
    {
        {
            if (_controller.router() == operator) {
                return true;
            }
        }

        return super.isApprovedForAll(owner, operator);
    }

    uint256[49] private __gap;
}
