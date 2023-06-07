// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

pragma solidity ^0.8.0;

/**
 * @dev Implementation of lightweight identity
 */
contract DevIdentity is Initializable {
    mapping(address => address) _identityOwner;
    mapping(address => uint256) _previousChange;

    event DIDOwnerChanged(
        address indexed identity,
        address owner,
        uint256 previousChange
    );

    event DIDAttributeChanged(
        address indexed identity,
        bytes32 name,
        bytes value,
        uint256 validTo,
        uint256 previousChange
    );

    function initialize() public initializer {
        //
    }

    //get owner of the identity
    function identityOwner(address identity) public view returns (address) {
        if (_identityOwner[identity] == address(0)) {
            return identity;
        }
        return _identityOwner[identity];
    }

    //change owner of the identity
    function changeOwner(address identity, address newOwner) public {
        require(
            msg.sender == identityOwner(identity),
            "DevIdentity: invalid caller"
        );
        require(newOwner != address(0), "DevIdentity: invalid newOwner");
        _identityOwner[identity] = newOwner;
        emit DIDOwnerChanged(identity, newOwner, _previousChange[identity]);
        _previousChange[identity] = block.number;
    }

    // change owner of the identity, signed by owner
    function changeOwnerSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        address newOwner
    ) public {
        bytes32 hashValue = keccak256(
            abi.encodePacked(
                "transfer ownership of identity:",
                identity,
                "to:",
                newOwner
            )
        );
        bytes32 salt = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hashValue)
        );
        require(
            identityOwner(identity) == ecrecover(salt, sigV, sigR, sigS),
            "DevIdentity: Invalid signature"
        );
        emit DIDOwnerChanged(identity, newOwner, _previousChange[identity]);
        _previousChange[identity] = block.number;
    }

    // change attribute of the identity with a validity of seconds
    function setAttribute(
        address identity,
        bytes32 name,
        bytes memory value,
        uint256 validity
    ) public {
        require(
            msg.sender == identityOwner(identity),
            "DevIdentity: invalid caller"
        );
        emit DIDAttributeChanged(
            identity,
            name,
            value,
            uint256(block.timestamp) + validity,
            _previousChange[identity]
        );
        _previousChange[identity] = block.number;
    }

    // change attribute of the identity with a validity of seconds, signed by the owner
    function setAttributeSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes32 name,
        bytes memory value,
        uint256 validity
    ) public {
        bytes32 hashValue = keccak256(abi.encodePacked(name, ":", value));
        bytes32 salt = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hashValue)
        );
        require(
            _identityOwner[identity] == ecrecover(salt, sigV, sigR, sigS),
            "DevIdentity: invalid signature"
        );
        emit DIDAttributeChanged(
            identity,
            name,
            value,
            uint256(block.timestamp) + validity,
            _previousChange[identity]
        );
        _previousChange[identity] = block.number;
    }
}
