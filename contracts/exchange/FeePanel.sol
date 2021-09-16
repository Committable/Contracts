// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FeePanel is Ownable {
    // fees are represented as percentile: 1000 refers to 10% and must be no larger than 100%
    // platForm fee paid to the exchange
    uint256 internal _fee;
    // mapping from token contract address to tokenId and then to royalty
    mapping(address => mapping(uint256 => uint256)) _royalty;
    // mapping from token contract address to tokenId and then to royaltyReceiver
    mapping(address => mapping(uint256 => address)) _royaltyRecipient;
    // platForm fee recipient
    address internal _recipient;

    event RoyaltyChanged(
        address indexed contractAddress,
        uint256 indexed tokenId,
        uint256 originalRoyalty,
        uint256 newRoyalty
    );
    event FeeChanged(uint256 originalFee, uint256 newFee);
    event RecipientChanged(address indexed originalRecipient, address indexed newRecipient);
    event RoyaltyRecipientSet(address indexed contractAdress, uint256 indexed tokenId, address indexed royaltyRecipient);
    constructor() {
        _recipient = msg.sender;
    }

    function getFee() external view returns (uint256) {
        return _fee;
    }

    function getRoyalty(address contractAddress, uint256 tokenId)
        external
        view
        returns (uint256)
    {
        return _royalty[contractAddress][tokenId];
    }

    function getRecipient() external view returns (address) {
        return _recipient;
    }

    function changeFee(uint256 fee) external onlyOwner {
        require(fee <= 10000, "invalid platform fee: must no larger than 100%");
        uint256 originalPlatformFee = _fee;
        _fee = fee;
        emit FeeChanged(originalPlatformFee, fee);
    }

    function _changeRoyalty(
        address contractAddress,
        uint256 tokenId,
        uint256 royalty
    ) internal {
        uint256 originalRoyalty = _royalty[contractAddress][tokenId];
        require(
            _fee + royalty <= 10000,
            "invalid royalty: sum of fee and royalty must no larger than 100%"
        );
        _royalty[contractAddress][tokenId] = royalty;
        emit RoyaltyChanged(
            contractAddress,
            tokenId,
            originalRoyalty,
            royalty
        );
    }
function _setRoyaltyRecipient(
        address contractAddress,
        uint256 tokenId,
        address royaltyRecipient
    ) internal {
        require(
            _royaltyRecipient[contractAddress][tokenId] == address(0),
            "royaltyRecipient cannot be changed"
        );
        _royaltyRecipient[contractAddress][tokenId] = royaltyRecipient;
        emit RoyaltyRecipientSet(
            contractAddress,
            tokenId,
            royaltyRecipient
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
