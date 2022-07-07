// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Vault is OwnableUpgradeable, ReentrancyGuardUpgradeable {
    function initialize() public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
    }

    function sendEther(address to, uint256 amount) external onlyOwner {
        payable(to).transfer(amount);
    }

    function sendERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        SafeERC20.safeTransfer(IERC20(token), to, amount);
    }

    receive() external payable{

    }

    uint256[50] private __gap;
}
