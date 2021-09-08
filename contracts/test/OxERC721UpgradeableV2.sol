// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "../ERC721/IOxERC721Upgradeable.sol";
import "../ERC721/OxERC721Tradable.sol";

contract OxERC721UpgradeableV2 is OxERC721Tradable, IOxERC721Upgradeable {
    mapping(uint256 => address) private _creator;

    function initialize(
        string memory _name,
        string memory _symbol,
        address proxyController
    ) public override initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained(_name, _symbol);
        __ERC721Enumerable_init_unchained();
        __ERC721Tradable_init_unchained(proxyController);
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
            interfaceId == type(IOxERC721Upgradeable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overriden in child contracts.
     * here _tokenURI() will return "http://<DOMAIN-NAME>/token-id=<tokenId>"
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return "https://app.committable.io/V2/nft/";
    }

    /**
     * @dev Safely mints `tokenId` and transfers it to `to`.
     *
     * Requirements:
     *
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, 
     which is called upon a safe transfer.
     * set current totalySupply as tokenId
     * Emits a {Transfer} event.
     */
    function safeMint(address to, uint256 tokenId) external virtual override {
        require(0 == 1, "V2: no longer allow mint");
        _safeMint(to, tokenId, "");
    }

    function safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) external virtual override {
        require(0 == 1, "V2: no longer allow mint");
        _safeMint(to, tokenId, _data);
    }

    function creatorOf(uint256 tokenId)
        external
        view
        virtual
        override
        returns (address)
    {
        return _creator[tokenId];
    }

    uint256[50] private __gap;
}
