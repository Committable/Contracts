// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ICommittableV1.sol";
import "./extensions/ERC721Committable.sol";

contract CommittableV1 is ERC721Committable, ICommittableV1 {
    function initialize(
        string memory _name,
        string memory _symbol,
        address controller
    ) public override initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained(_name, _symbol);
        __ERC721Committable_init_unchained(controller);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165Upgradeable, ERC721Committable)
        returns (bool)
    {
        return
            interfaceId == type(ICommittableV1).interfaceId ||
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

    uint256[50] private __gap;
}
