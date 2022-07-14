// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FeePanel is Ownable {
    // fees are represented as percentile: 1000 refers to 10% and must be no larger than 100%
    // platForm fee paid to the exchange
    uint256 internal _fee;
    // platForm fee recipient
    address internal _recipient;

    event FeeChanged(uint256 originalFee, uint256 newFee);
    event RecipientChanged(
        address indexed originalRecipient,
        address indexed newRecipient
    );

    constructor() {
        _recipient = msg.sender;
    }

    function getFee() external view returns (uint256) {
        return _fee;
    }

    function getRecipient() external view returns (address) {
        return _recipient;
    }

    function changeFee(uint256 fee) external onlyOwner {
        require(fee <= 1000, "Exchange: fee must no larger than 10%");
        uint256 originalPlatformFee = _fee;
        _fee = fee;
        emit FeeChanged(originalPlatformFee, fee);
    }

    function changeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "zero address not allowed");
        address originalRecipient = _recipient;
        _recipient = recipient;
        emit RecipientChanged(originalRecipient, _recipient);
    }
}
