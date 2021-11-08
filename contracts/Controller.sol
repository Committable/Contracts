// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "./Router.sol";

contract Controller is ProxyAdmin {
    address public defaultRouter;
    address public signer;
    mapping(address => address) public userRouters;

    event RouterRegistered(address indexed user, address indexed router);

    constructor() {
        signer = msg.sender;
    }

    function setDefaultRouter(address defaultRouter_) external onlyOwner {
        defaultRouter = defaultRouter_;
    }

    function registerRouter() external {
        address userRouter = address(new Router(address(this)));
        userRouters[msg.sender] = userRouter;
        emit RouterRegistered(msg.sender, userRouter);
    }

    function getRouter(address user_) external view returns (address) {
        if (userRouters[user_] == address(0)) {
            return defaultRouter;
        }
        return userRouters[user_];
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }
}
