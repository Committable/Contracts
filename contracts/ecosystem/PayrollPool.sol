// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../Controller.sol";

contract PayrollPool is ReentrancyGuard, Initializable {
    // solhint-disable-next-line
    bytes32 public DOMAIN_SEPARATOR;
    string public name;
    Controller internal _controller;
    /** mapping from pool index to user address to userInfo */
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    /** mapping from pool index to poolInfo */
    mapping(uint256 => PoolInfo) public poolInfo;
    struct UserInfo {
        bool isClaimed;
    }
    struct PoolInfo {
        address creator;
        address rewardToken;
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

    function initialize(address controller) public initializer {
        _controller = Controller(controller);
        name = "PayrollPool";
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    /**
     * @dev return pool info by index
     * @param index pool index
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
     * @param index pool index
     * @param user user address
     */
    function getUserInfo(uint256 index, address user)
        external
        view
        returns (bool)
    {
        return userInfo[index][user].isClaimed;
    }

    /**
     * @dev create payroll pool and provide reward tokens
     * @param index pool index
     * @param rewardToken reward token contract address
     * @param rewardAmount reward amount
     * @param start payroll pool start-time
     * @param end payroll pool end-time
     */
    function create(
        uint256 index,
        address rewardToken,
        uint256 rewardAmount,
        uint256 start,
        uint256 end
    ) external payable nonReentrant {
        require(
            poolInfo[index].creator == address(0),
            "PayrollPool: pool already exists"
        );
        require(start < end, "PayrollPool: invalid timestamp");
        
        poolInfo[index] = (
            PoolInfo({
                creator: msg.sender,
                rewardToken: rewardToken,
                rewardAmount: rewardAmount,
                unclaimedAmount: rewardAmount,
                start: start,
                end: end
            })
        );
        if (rewardToken == address(0)) {
            require(
                msg.value == rewardAmount,
                "PayrollPool: insufficient ether"
            );
        } else {
            require(
                msg.value == 0,
                "PayrollPool: sending ether with erc20 not allowed"
            );
            SafeERC20.safeTransferFrom(
                IERC20(rewardToken),
                msg.sender,
                address(this),
                rewardAmount
            );
        }

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
     * @dev claim pool tokens, must provide server signature
     * @param index pool index
     * @param amount payroll amount to claim
     * @param signature signature offered by server
     */
    function claim(
        uint256 index,
        uint256 amount,
        bytes memory signature
    ) external nonReentrant {
        // verify signature
        _verify(index, amount, signature);
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

        userInfo[index][msg.sender].isClaimed = true;
        poolInfo[index].unclaimedAmount -= amount;

        address rewardToken = poolInfo[index].rewardToken;
        if (rewardToken == address(0)) {
            address payable user = payable(msg.sender);
            user.transfer(amount);
        } else {
            SafeERC20.safeTransfer(IERC20(rewardToken), msg.sender, amount);
        }

        emit RewardClaimed(index, rewardToken, amount, msg.sender);
    }

    /**
     * @dev creator withdrawl unclaimed rewardToken after end-time
     * @param index pool index
     */
    function withdraw(uint256 index) external nonReentrant {
        require(
            poolInfo[index].creator != address(0),
            "PayrollPool: query of non-existence pool"
        );
        require(
            msg.sender == poolInfo[index].creator,
            "PayrollPool: only creator"
        );
        require(
            block.timestamp >= poolInfo[index].end,
            "PayrollPool: invalid timestamp"
        );
        require(
            poolInfo[index].unclaimedAmount > 0,
            "PayrollPool: non-unclaimed tokens"
        );
        uint256 unclaimedAmount = poolInfo[index].unclaimedAmount;
        poolInfo[index].unclaimedAmount = 0;

        address rewardToken = poolInfo[index].rewardToken;
        if (rewardToken == address(0)) {
            address payable user = payable(msg.sender);
            user.transfer(unclaimedAmount);
        } else {
            SafeERC20.safeTransfer(
                IERC20(rewardToken),
                msg.sender,
                unclaimedAmount
            );
        }

        emit RewardClaimed(
            index,
            address(rewardToken),
            unclaimedAmount,
            msg.sender
        );
    }

    /**
     * @dev verify signature
     * @param index pool index
     * @param amount payroll amount to claim
     * @param signature signature offered by server
     */
    function _verify(
        uint256 index,
        uint256 amount,
        bytes memory signature
    ) internal view {
        if (signature.length != 65) {
            revert("ECDSA: invalid signature length");
        }
        // Divide the signature in r, s and v variables
        bytes32 r;
        bytes32 s;
        uint8 v;

        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        //keccak256("Claim(uint256 index,uint256 amount,address user)")
                        0x2c400e34dccd136c63692253b13cbe502fc45768c04c0584e74b7cc15fda3487,
                        index,
                        amount,
                        msg.sender
                    )
                )
            )
        );
        require(
            ecrecover(digest, v, r, s) == _controller.getSigner(),
            "invalid signature"
        );
    }

    uint256[45] private __gap;

}
