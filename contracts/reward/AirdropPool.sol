// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Controller.sol";
import "../library/ECDSA.sol";

contract AirdropPool is Ownable, ReentrancyGuard {
    Controller internal _controller;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    mapping(uint256 => PoolInfo) public poolInfo;
    struct UserInfo {
        bool isClaimed;
    }
    struct PoolInfo {
        address creator;
        IERC20 rewardToken;
        uint256 rewardAmount;
        uint256 unclaimedAmount;
        uint256 start;
        uint256 end;
    }

    event PoolCreated(
        uint256 indexed index,
        address indexed rewardToken,
        uint256 rewardAmount,
        address indexed creator,
        uint256 start,
        uint256 end
    );

    event RewardClaimed(
        uint256 indexed index,
        address indexed rewardToken,
        uint256 rewardAmount,
        address indexed user
    );

    constructor(address controller) {
        _controller = Controller(controller);
    }

    /**
     * @dev return pool info by index
     */
    function getPoolInfo(uint256 index)
        external
        view
        returns (PoolInfo memory)
    {
        return poolInfo[index];
    }

    /**
     * @dev return user info by pool index and address, return true when user has claimed the token
     */
    function getUserInfo(uint256 index, address user)
        external
        view
        returns (bool)
    {
        return userInfo[index][user].isClaimed;
    }

    /**
     * @dev create airdrop pool and provide reward tokens
     */
    function create(
        uint256 index,
        address rewardToken,
        uint256 rewardAmount,
        uint256 start,
        uint256 end
    ) external nonReentrant {
        require(poolInfo[index].creator == address(0), "pool already exists");
        SafeERC20.safeTransferFrom(
            IERC20(rewardToken),
            msg.sender,
            address(this),
            rewardAmount
        );
        poolInfo[index] = (
            PoolInfo({
                creator: msg.sender,
                rewardToken: IERC20(rewardToken),
                rewardAmount: rewardAmount,
                unclaimedAmount: rewardAmount,
                start: start,
                end: end
            })
        );

        emit PoolCreated(
            index,
            rewardToken,
            rewardAmount,
            msg.sender,
            start,
            end
        );
    }

    /**
     * @dev claim airdrop tokens, must provide server signature
     */
    function claim(
        uint256 index,
        uint256 amount,
        bytes memory sig
    ) external nonReentrant {
        require(
            poolInfo[index].creator != address(0),
            "query of non-existence pool"
        );
        require(
            block.timestamp > poolInfo[index].start &&
                block.timestamp < poolInfo[index].end,
            "invalid timestamp"
        );
        require(!userInfo[index][msg.sender].isClaimed, "claim once only");
        bytes32 hash = keccak256(abi.encode(index, amount, msg.sender));
        require(
            ECDSA.recover(hash, sig) == _controller.getSigner(),
            "invalid signature"
        );
        userInfo[index][msg.sender].isClaimed = true;
        poolInfo[index].unclaimedAmount -= amount;
        IERC20 rewardToken = poolInfo[index].rewardToken;
        SafeERC20.safeTransfer(rewardToken, msg.sender, amount);
        emit RewardClaimed(index, address(rewardToken), amount, msg.sender);
    }

    /**
     * @dev creator can withdrawl unclaimed rewardToken after end-time
     */
    function withdraw(uint256 index) external nonReentrant {
        require(
            poolInfo[index].creator != address(0),
            "query of non-existence pool"
        );
        require(msg.sender == poolInfo[index].creator, "only creator");
        require(block.timestamp >= poolInfo[index].end, "invalid timestamp");
        IERC20 rewardToken = poolInfo[index].rewardToken;
        uint256 unclaimedAmount = poolInfo[index].unclaimedAmount;
        SafeERC20.safeTransfer(rewardToken, msg.sender, unclaimedAmount);
        emit RewardClaimed(
            index,
            address(rewardToken),
            unclaimedAmount,
            msg.sender
        );
        poolInfo[index].unclaimedAmount = 0;
    }
}
