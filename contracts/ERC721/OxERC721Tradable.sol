// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../ProxyController.sol";
import "../TransferProxy.sol";

contract OxERC721Tradable is ERC721EnumerableUpgradeable {
    ProxyController _proxyController;

    // solhint-disable-next-line
    function __ERC721Tradable_init_unchained(address proxyController)
        internal
        initializer
    {
        _proxyController = ProxyController(proxyController);
    }

    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool)
    {
        {
            if (_proxyController.transferProxy() == operator) {
                return true;
            }
        }

        return super.isApprovedForAll(owner, operator);
    }

    uint256[49] private __gap;
}
