// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Vault is Initializable {
    mapping(string => mapping(address => uint256)) public reserve;

    event Deposit(string indexed repoId, address indexed token, uint256 amount);

    function initialize() public initializer {
        //
    }

    function depositWithEther(string memory repoId) external payable {
        require(msg.value > 0, "Vault: zero value not allowed");
        unchecked {
            // overflow is literally unrealistic for ethers
            reserve[repoId][address(0)] += msg.value;
        }

        emit Deposit(repoId, address(0), msg.value);

    }

    function depositWithERC20(
        string memory repoId,
        address token,
        uint256 amount
    ) external  {
        reserve[repoId][token] += amount;
        SafeERC20.safeTransferFrom(
            IERC20(token),
            msg.sender,
            address(this),
            amount
        );
        emit Deposit(repoId, token, amount);

    }

    uint256[49] private __gap;
}
