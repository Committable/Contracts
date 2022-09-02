// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC721Fundable.sol";
import "../exchange/TransferProxy.sol";
import "../Controller.sol";

contract ERC721Committable is ERC721Fundable, OwnableUpgradeable {
    Controller internal _controller;
    uint256 internal _totalSupply;
    string public baseURI;
    // solhint-disable-next-line
    bytes32 public DOMAIN_SEPARATOR;

    function initialize(
        string memory _name,
        string memory _symbol,
        address controller
    ) public initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained(_name, _symbol);
        __Ownable_init();

        _controller = Controller(controller);
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

    /**
     * @dev Mint a token to address with signature check
     */
    function mint(
        address creator,
        uint256 tokenId,
        bytes memory signature
    ) public virtual {
        _verify(creator, tokenId, signature);
        _mint(creator, tokenId);
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
            revert("ECDSA: invalid signature length");
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
            ecrecover(digest, v, r, s) == _controller.getSigner(),
            "invalid token signature"
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
        if (address(_controller.getTransferProxy()) == operator) {
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

    uint256[46] private __gap;
}
