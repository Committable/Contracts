// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Vault.sol";
import "../ERC721/ERC721Committable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Royalty hanlder
 */
contract RoyaltyDistributor is Ownable {
    address public wethAddress = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
    address public vaultAddress;
    address public committableERC721;
    address public dev;
    uint256 internal _lastTokenId;

    constructor(address _committableERC721, address _vaultAddress) {
        vaultAddress = _vaultAddress;
        committableERC721 = _committableERC721;
        dev = msg.sender;
    }

    function update(uint256 tokenId) external {
        require(
            msg.sender == committableERC721,
            "RoyaltyDistributor: invalid sender"
        );
        // distribute royalty for last transferred token
        _distribute(_lastTokenId);
        _lastTokenId = tokenId;
    }

    function _distribute(uint256 tokenId) internal {
        if (tokenId != 0) {
            uint256 ethBalance = address(this).balance;
            // read repoId of a token
            string memory repoId = ERC721Committable(committableERC721)
                .repoIdOf(tokenId);
            if (ethBalance > 0) {
                // 50% of royalty is sent to repo vault, another 50% is sent to dev
                uint256 repoRoyalty = ethBalance / 2;
                // last uint96 of tokenId represents its rid
                Vault(vaultAddress).depositWithEther{value: repoRoyalty}(
                    repoId
                );
                // prevent re-entrancy
                payable(dev).transfer(ethBalance - repoRoyalty);
            }
            // wont revert on test envrionment
            if (address(wethAddress).code.length > 0) {
                uint256 wethBalance = IERC20(wethAddress).balanceOf(
                    address(this)
                );
                if (wethBalance > 0) {
                    IERC20(wethAddress).approve(vaultAddress, wethBalance);
                    // 50% of royalty is sent to repo vault, another 50% is sent to dev
                    uint256 repoRoyalty = wethBalance / 2;
                    // last uint96 of tokenId represents its rid
                    Vault(vaultAddress).depositWithERC20(
                        repoId,
                        wethAddress,
                        repoRoyalty
                    );
                    IERC20(wethAddress).transfer(
                        dev,
                        wethBalance - repoRoyalty
                    );
                }
            }
        }
    }

    function changeDevAddress(address _dev) external onlyOwner {
        require(
            _dev != dev && _dev != address(0),
            "RoyaltyDistributor: invalid dev"
        );
        dev = _dev;
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

    fallback() external payable {}
}
