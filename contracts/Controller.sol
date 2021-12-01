// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "./Router.sol";

contract Controller is ProxyAdmin {
    address private _defaultRouter;
    address private _signer;
    mapping(address => address) private _userRouters;
    mapping(address => bool) private _isApproved;

    event RouterRegistered(address indexed user, address indexed router);
    event ExchangeApprovedOrCancelled(
        address indexed exchange,
        bool authorized
    );

    constructor() {
        _signer = msg.sender;
    }

    function setDefaultRouter(address defaultRouter_) external onlyOwner {
        _defaultRouter = defaultRouter_;
    }

    function registerRouter() external {
        address userRouter = address(new Router(address(this)));
        _userRouters[msg.sender] = userRouter;
        emit RouterRegistered(msg.sender, userRouter);
    }

    function getRouter(address user_) external view returns (address) {
        if (_userRouters[user_] == address(0)) {
            return _defaultRouter;
        }
        return _userRouters[user_];
    }

    function setSigner(address signer_) external onlyOwner {
        _signer = signer_;
    }

    function getSigner() external view returns (address) {
        return _signer;
    }

    function approveOrCancel(address exchange_, bool bool_) external onlyOwner {
        _isApproved[exchange_] = bool_;
        emit ExchangeApprovedOrCancelled(exchange_, bool_);
    }

    function isApproved(address exchange_) external view returns (bool) {
        return _isApproved[exchange_];
    }
}
