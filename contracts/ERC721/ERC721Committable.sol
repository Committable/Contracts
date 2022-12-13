// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC721Fundable.sol";
import "../Controller.sol";
import "operator-filter-registry/src/upgradeable/DefaultOperatorFiltererUpgradeable.sol";
import "../royalty/RoyaltyDistributor.sol";

/**
 * @dev Implementation of Committable ERC721 token
 */

contract ERC721Committable is
    ERC721Fundable,
    OwnableUpgradeable,
    DefaultOperatorFiltererUpgradeable
{
<<<<<<< HEAD
=======

>>>>>>> 6a3ce7e84257ab7ae6716ca5ab1c864f9fac15b0
    uint256 internal _totalSupply;
    string public baseURI;
    address public signer;
    address public royaltyDistributor;
    mapping(address => bool) public whitelisted;
    // solhint-disable-next-line
    bytes32 public DOMAIN_SEPARATOR;

    function initialize(
        string memory _name,
        string memory _symbol,
        address _signer,
        address _royaltyDistributor
    ) public initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained(_name, _symbol);
        __Ownable_init_unchained();
        __DefaultOperatorFilterer_init();
        signer = _signer;
        royaltyDistributor = _royaltyDistributor;
<<<<<<< HEAD
=======

>>>>>>> 6a3ce7e84257ab7ae6716ca5ab1c864f9fac15b0
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(_name)),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overriden in child contracts.
     * here _tokenURI() will return "http://<DOMAIN-NAME>/token-id=<tokenId>"
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev owner can change baseURI
     */
    function changeBaseURI(string memory newURI) external onlyOwner {
        baseURI = newURI;
    }

    function changeSigner(address newSigner) external onlyOwner {
        require(signer != newSigner, "ERC721Committable: duplicate signer");
        signer = newSigner;
    }

    function registerOperator(address operator, bool ok) external onlyOwner {
        whitelisted[operator] = ok;
    }

    function changeRoyaltyDistributor(address newRoyaltyDistributor) external onlyOwner {
        require(royaltyDistributor  !=newRoyaltyDistributor, "ERC721Committable: duplicate distributor");
        royaltyDistributor = newRoyaltyDistributor;
    }

    /**
     * @dev Mint a token to address with signature check, claim rewards if appliable when creator call this function
     */
    function mint(
        address creator,
        uint256 tokenId,
        bytes memory signature
    ) public virtual {
        if (signer != address(0)) {
            _verify(creator, tokenId, signature);
        }
        _mint(creator, tokenId);
        // claim reward if 1) msg.sender is token owner 2) have funds
        if (msg.sender == creator && fundsOf(tokenId) > 0) {
            claim(tokenId);
        }
    }

    /**
     * @dev Verify signature
     */
    function _verify(
        address creator,
        uint256 tokenId,
        bytes memory signature
    ) internal view {
        if (signature.length != 65) {
            revert("ERC721Committable: invalid signature length");
        }

        // Divide the signature in r, s and v variables
        bytes32 r;
        bytes32 s;
        uint8 v;

        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // bytes32 digest = keccak256(
        //     abi.encodePacked(
        //         "\x19Ethereum Signed Message:\n32",
        //         keccak256(abi.encode(creator, tokenId))
        //     )
        // );

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        //keccak256("Mint(address creator,uint256 tokenId)")
                        0xe6c296e11cbaaec3fa9033cd6f86ffb254e2601a752ff969259c9aa361b35d89,
                        creator,
                        tokenId
                    )
                )
            )
        );
        require(
            ecrecover(digest, v, r, s) == signer,
            "ERC721Committable:invalid token signature"
        );
    }

    /**
     * @dev Override isApprovedForAll to whitelist user's router accounts to enable gas-less approval.
     */
    function isApprovedForAll(address tokenOwner, address operator)
        public
        view
        override(ERC721Fundable)
        returns (bool)
    {
        // Whitelist transferProxy for easy trading.
        if (whitelisted[operator] == true) {
            return true;
        }

        return super.isApprovedForAll(tokenOwner, operator);
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);
        if (from == address(0)) {
            // assume totalSupply is less than 2**256-1, overflow is unrealistic
            unchecked {
                _totalSupply = _totalSupply + 1;
            }
        }
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        // notify distributor transferred tokenId
        if (royaltyDistributor != address(0) && from != address(0)) {
            (bool success, ) = royaltyDistributor.call(
                abi.encodeWithSignature("distribute(uint256)", tokenId)
            );
<<<<<<< HEAD
=======

>>>>>>> 6a3ce7e84257ab7ae6716ca5ab1c864f9fac15b0
            if (success) {
                //
            }
        }
        super._afterTokenTransfer(from, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved)
        public
        override
        onlyAllowedOperatorApproval(operator)
    {
        super.setApprovalForAll(operator, approved);
    }

    function approve(address operator, uint256 tokenId)
        public
        override
        onlyAllowedOperatorApproval(operator)
    {
        super.approve(operator, tokenId);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    uint256[44] private __gap;
<<<<<<< HEAD
=======

>>>>>>> 6a3ce7e84257ab7ae6716ca5ab1c864f9fac15b0
}
