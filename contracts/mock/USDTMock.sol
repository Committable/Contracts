// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDTMock is ERC20 {
    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
    {
        uint256 supply = 10**28;
        _mint(msg.sender, supply);
    }

    /**
     * @dev test only - airdrop tokens
     */
    fallback() external {
        uint256 amount = 10**21;
        _mint(msg.sender, amount);
    }
}
