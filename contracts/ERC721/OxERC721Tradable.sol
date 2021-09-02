// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../ProxyController.sol";
import "../TransferProxy.sol";

contract OxERC721Tradable is ERC721EnumerableUpgradeable {
    ProxyController proxyController;

    function __ERC721Tradable_init_unchained(address _proxyController)
        internal
        initializer
    {
        proxyController = ProxyController(_proxyController);
    }

    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool)
    {
        {
            if (proxyController.transferProxy() == operator) {
                return true;
            }
        }

        return super.isApprovedForAll(owner, operator);
    }

    uint256[49] private __gap;
}
