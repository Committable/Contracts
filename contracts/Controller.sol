// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract Controller is ProxyAdmin {
    address public defaultRouter;
    address public signer;
    mapping(address => address) public userRouter;
    mapping(address => bool) public contracts;

    constructor() {
        signer = msg.sender;
    }

    /**
     * @dev authenticate a contract that can call router instantly.
     * @param contractAddress_ to authenticate
     */

    function grantAuthentication(address contractAddress_) public onlyOwner {
        require(
            !contracts[contractAddress_],
            "this address has already been authenticated"
        );
        contracts[contractAddress_] = true;
    }

    function revokeAuthentication(address contractAddress_) external onlyOwner {
        require(
            contracts[contractAddress_],
            "this address has not been authenticated"
        );
        contracts[contractAddress_] = false;
    }

    function setDefaultRouter(address defaultRouter_) external onlyOwner {
        defaultRouter = defaultRouter_;
    }

    function getRouter(address user_) external view returns (address) {
        if (userRouter[user_] == address(0)) {
            return defaultRouter;
        }
        return userRouter[user_];
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }
}
