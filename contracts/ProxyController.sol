// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract ProxyController is ProxyAdmin {
    address public transferProxy;
    mapping(address => bool) public contracts;

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

    function setProxy(address _transferProxy) external onlyOwner {
        transferProxy = _transferProxy;
    }
}
