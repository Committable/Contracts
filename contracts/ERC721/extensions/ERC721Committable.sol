// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../Controller.sol";
// import "../../library/ECDSA.sol";
import "./IERC721Committable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../../TransferProxy.sol";

contract ERC721Committable is ERC721Upgradeable, IERC721Committable {
    Controller internal _controller;
    uint256 internal _totalSupply;

    // solhint-disable-next-line
    function __ERC721Committable_init_unchained(address controller)
        internal
        initializer
    {
        _controller = Controller(controller);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165Upgradeable, ERC721Upgradeable)
        returns (bool)
    {
        return
            interfaceId == type(IERC721Committable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Mint a token to address with signature check
     */
    function mint(
        address creator,
        uint256 tokenId,
        bytes memory signature
    ) public virtual override {
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

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encode(creator, tokenId))
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
    function isApprovedForAll(address owner, address operator)
        public
        view
        override(ERC721Upgradeable, IERC721Upgradeable)
        returns (bool)
    {
        // Whitelist transferProxy for easy trading.
        if (address(_controller.getTransferProxy()) == operator) {
            return true;
        }

        return super.isApprovedForAll(owner, operator);
    }

    function totalSupply() external view override returns (uint256) {
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

    uint256[48] private __gap;
}
