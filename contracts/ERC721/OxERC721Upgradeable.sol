// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./OxIERC721Upgradeable.sol";
import "./extensions/OxERC721Committable.sol";

contract OxERC721Upgradeable is OxERC721Committable, OxIERC721Upgradeable {
    function initialize(
        string memory _name,
        string memory _symbol,
        address controller
    ) public override initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained(_name, _symbol);
        __ERC721Enumerable_init_unchained();
        __ERC721Tradable_init_unchained(controller);
        address signer = Controller(controller).signer();
        __ERC721Committable_init_unchained(signer);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165Upgradeable, OxERC721Committable)
        returns (bool)
    {
        return
            interfaceId == type(OxIERC721Committable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overriden in child contracts.
     * here _tokenURI() will return "http://<DOMAIN-NAME>/token-id=<tokenId>"
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return "https://app.committable.io/nft/";
    }

    uint256[49] private __gap;
}
