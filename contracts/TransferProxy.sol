// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ProxyController.sol";
abstract contract ERC721 {
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external virtual;
}

contract TransferProxy {
    mapping(address => bool) public isDisabled;
    ProxyController public proxyController;
    event proxyDisabled(address indexed _address, bool);

    constructor(address _address) {
        proxyController = ProxyController(_address);
    }
    

    function safeTransferFrom(
        address _token,
        address _from,
        address _to,
        uint256 tokenId
    ) external {
        require(!isDisabled[_from], "token owner has disabled transfer proxy");
        require(proxyController.contracts(msg.sender), "only registered address can visit this proxy");
        ERC721(_token).safeTransferFrom(_from, _to, tokenId);
    }

    /**
     * @dev Allow user to manage their proxy status
     * @param _bool, transferProxy is disabled when the _bool is set to true
     */
    function disable(bool _bool) external {
        isDisabled[msg.sender] = _bool;
        emit proxyDisabled(msg.sender, _bool);
    }
}
