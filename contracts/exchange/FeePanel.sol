// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FeePanel is Ownable {
    // fees are represented as percentile: 1000 equals to 10% and must be no larger than 100%
    uint256 internal _platformFee;
    mapping(address => mapping(uint256 => uint256)) _patentFeeOf;
    address internal _recipient;

    event PatentFeeChanged(
        address indexed contractAddress,
        uint256 indexed tokenId,
        uint256 originalFee,
        uint256 newFee
    );
    event PlatformFeeChanged(uint256 originalFee, uint256 newFee);
    event RecipientChanged(address originalRecipient, address newRecipient);

    constructor() {
        _recipient = msg.sender;
    }

    function getPlatformFee() external view returns (uint256) {
        return _platformFee;
    }

    function getPatentFee(address contractAddress, uint256 tokenId)
        external
        view
        returns (uint256)
    {
        return _patentFeeOf[contractAddress][tokenId];
    }

    function getRecipient() external view returns (address) {
        return _recipient;
    }

    function changePlatformFee(uint256 _fee) external onlyOwner {
        uint256 originalPlatformFee = _platformFee;
        require(
            _fee <= 10000,
            "invalid platform fee: must no larger than 100%"
        );
        _platformFee = _fee;
        emit PlatformFeeChanged(originalPlatformFee, _fee);
    }

    function _changePatentFee(
        address contractAddress,
        uint256 tokenId,
        uint256 _fee
    ) internal {
        uint256 originalPatentFee = _patentFeeOf[contractAddress][tokenId];
        require(
            _fee + _platformFee <= 10000,
            "invalid patent fee: total fee must no larger than 100%"
        );
        _patentFeeOf[contractAddress][tokenId] = _fee;
        emit PatentFeeChanged(
            contractAddress,
            tokenId,
            originalPatentFee,
            _fee
        );
    }

    function changeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "zero address not allowed");
        require(recipient != _recipient, "same address not allowed");

        address originalRecipient = _recipient;
        _recipient = recipient;
        emit RecipientChanged(originalRecipient, _recipient);
    }
}
