// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Vault is Initializable {
    mapping(uint96 => mapping(address => uint256)) public reserve;

    event Deposit(uint96 indexed rid, address indexed token, uint256 amount);

    function initialize() public initializer {
        //
    }

    function depositWithEther(uint96 rid) external payable {
        require(msg.value > 0, "Vault: zero value not allowed");
        unchecked {
            // overflow is literally unrealistic for ethers
            reserve[rid][address(0)] += msg.value;
        }

        emit Deposit(rid, address(0), msg.value);

    }

    function depositWithERC20(
        uint96 rid,
        address token,
        uint256 amount
    ) external  {
        reserve[rid][token] += amount;
        SafeERC20.safeTransferFrom(
            IERC20(token),
            msg.sender,
            address(this),
            amount
        );
        emit Deposit(rid, token, amount);

    }

    uint256[49] private __gap;
}
