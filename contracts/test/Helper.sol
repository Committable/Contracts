// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../library/OrderUtils.sol";
import "../library/ArrayUtils.sol";
import "../library/ECDSA.sol";
import "../ERC721/CommittableV1.sol";

contract Helper {
    function hashOrder(OrderUtils.Order memory order)
        external
        pure
        returns (bytes32)
    {
        return OrderUtils.hash(order);
    }

    function recover(bytes32 orderHash, bytes memory sig)
        external
        pure
        returns (address)
    {
        return ECDSA.recover(orderHash, sig);
    }

    function replace(
        bytes memory data,
        bytes memory desired,
        bytes memory mask
    ) external pure returns (bytes memory) {
        return ArrayUtils.guardedArrayReplace(data, desired, mask);
    }

    /**
     * @dev Returns token IDs at a given arrary of `index` of user owned tokens stored by token contract
     */
    function tokenOfOwnerByIndexBatch(
        address _token,
        address owner,
        uint256[] memory indexes
    ) external view virtual returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](indexes.length);
        for (uint256 i = 0; i < indexes.length; ++i) {
            tokenIds[i] = CommittableV1(_token).tokenOfOwnerByIndex(
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
            tokenIds[i] = CommittableV1(_token).tokenByIndex(indexes[i]);
        }
        return tokenIds;
    }
}
