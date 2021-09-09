// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ProxyController.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ERC721/OxIERC721Upgradeable.sol";

contract TransferProxy {
    mapping(address => bool) public isDisabled;
    ProxyController public proxyController;
    event ProxyDisabled(address indexed _address, bool _bool);

    constructor(address _address) {
        proxyController = ProxyController(_address);
    }

    function transferERC721(
        address _token,
        address _from,
        address _to,
        uint256 tokenId
    ) external {
        require(!isDisabled[_from], "token owner has disabled transfer proxy");
        require(
            proxyController.contracts(msg.sender),
            "only registered address can visit this proxy"
        );
        OxIERC721Upgradeable(_token).safeTransferFrom(_from, _to, tokenId);
    }

    function transferERC20(
        address _token,
        address _from,
        address _to,
        uint256 amount
    ) external {
        require(!isDisabled[_from], "token owner has disabled transfer proxy");
        require(
            proxyController.contracts(msg.sender),
            "only registered address can visit this proxy"
        );
        SafeERC20.safeTransferFrom(IERC20(_token), _from, _to, amount);
    }

    /**
     * @dev Allow user to manage their proxy status
     * @param _bool, transferProxy is disabled when the _bool is set to true
     */
    function disable(bool _bool) external {
        isDisabled[msg.sender] = _bool;
        emit ProxyDisabled(msg.sender, _bool);
    }
}
