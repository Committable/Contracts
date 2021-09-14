// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract Controller is ProxyAdmin {
    address public router;
    address public signer;
    mapping(address => bool) public contracts;

    constructor() {
        signer = msg.sender;
    }

    /**
     * @dev authenticate a contract that can call transferProxy instantly.
     * @param _address to authenticate
     */

    function grantAuthentication(address _address) public onlyOwner {
        require(
            !contracts[_address],
            "this address has already been authenticated"
        );
        contracts[_address] = true;
    }

    function revokeAuthentication(address _address) external onlyOwner {
        require(contracts[_address], "this address has not been authenticated");
        contracts[_address] = false;
    }

    function setRouter(address _router) external onlyOwner {
        router = _router;
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }
}
