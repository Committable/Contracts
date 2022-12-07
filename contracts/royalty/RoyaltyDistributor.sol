// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Vault.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RoyaltyDistributor is Ownable {
    address public wehAddress = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
    address public vaultAddress;
    address public committableERC721;

    constructor(address _committableERC721, address _vaultAddress) {
        vaultAddress = _vaultAddress;
        committableERC721 = _committableERC721;
    }

    function distribute(uint256 tokenId) external {
        require(
            msg.sender == committableERC721,
            "RoyaltyDistributor: invalid sender"
        );
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            // last uint96 of tokenId represents its rid
            Vault(vaultAddress).depositWithEther{value: ethBalance}(
                uint96(tokenId)
            );
        }
        uint256 wethBalance = IERC20(wehAddress).balanceOf(address(this));
        if (wethBalance > 0) {
            IERC20(wehAddress).approve(vaultAddress, wethBalance);
            Vault(vaultAddress).depositWithERC20(
                uint96(tokenId),
                wehAddress,
                wethBalance
            );
        }
    }

    function sendEther(address recipient, uint256 value) external onlyOwner {
        payable(recipient).transfer(value);
    }

    function sendERC20(
        address recipient,
        address tokenAddress,
        uint256 value
    ) external onlyOwner {
        IERC20(tokenAddress).transfer(recipient, value);
    }

    // receive royalty
    receive() external payable {}
}
