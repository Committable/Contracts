// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "./exchange/TransferProxy.sol";

contract Controller is ProxyAdmin {
    address private _signer;
    address private _transferProxy;
    address private _royaltyDistributor;
    mapping(address => bool) private _isApproved;

    event TransferProxyRegistered(address indexed transferProxy);
    event RoyaltyDistributorRegistered(address indexed royaltyDistributor);
    event ExchangeApprovedOrCancelled(
        address indexed exchange,
        bool authorized
    );

    // token signer is the address that sign token creator and tokenId
    constructor(address signer) {
        _signer = signer;
    }

    function registerTransferProxy(address transferProxy_) external onlyOwner {
        _transferProxy = transferProxy_;
        emit TransferProxyRegistered(_transferProxy);
    }

    function registerRoyaltyDistributor(address royaltyDistributor) external onlyOwner {
        _royaltyDistributor = royaltyDistributor;
        emit RoyaltyDistributorRegistered(royaltyDistributor);
    }

    function setSigner(address signer_) external onlyOwner {
        _signer = signer_;
    }

    function getTransferProxy() external view returns (address) {
        return _transferProxy;
    }

    function getRoyaltDistributor() external view returns(address){
        return _royaltyDistributor;
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
