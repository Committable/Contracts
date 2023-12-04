// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ERC721/ERC721Committable.sol";

contract BountyMaster {
    ERC721Committable public erc721Committable;
    mapping(uint96 => Bounty) private bounties;
    mapping(uint96 => mapping(address => UserBounty)) private addressBounties;
    mapping(uint96 => mapping(uint256 => UserBounty)) private tokenBounties;

    struct Bounty {
        uint96 id;
        address owner;
        address rewardToken;
        uint256 amount;
        uint160 deadline;
        uint96 status;
        /**
         * 0: Pending
         * 1: Accepted
         * 2: Withdraw
         */
    }

    struct UserBounty {
        address rewardToken;
        uint256 amount;
    }

    event BountyCreated(
        uint96 indexed id,
        address indexed owner,
        address rewardToken,
        uint256 amount,
        uint256 deadline
    );
    event BountyWithdrawed(
        uint96 indexed id,
        address indexed owner,
        address rewardToken,
        uint256 amount
    );
    event BountyAccepted(uint96 indexed id, address indexed owner, uint256 indexed typeNum);
    // 0 for pay to address
    // 1 for pay to token
    event BountyClaimed(
        uint96 indexed id,
        address indexed user,
        address rewardToken,
        uint256 amount
    );

    constructor(address _erc721Committable) {
        erc721Committable = ERC721Committable(_erc721Committable);
    }

    function createBountyWithERC20(
        uint96 id,
        address rewardToken,
        uint256 amount,
        uint160 deadline
    ) external {
        require(bounties[id].owner == address(0), "Bounty: id already existed");
        require(
            rewardToken != address(0),
            "Bounty: invalid rewardToken contract"
        );
        SafeERC20.safeTransferFrom(
            IERC20(rewardToken),
            msg.sender,
            address(this),
            amount
        );

        Bounty memory newBounty = Bounty(
            id,
            msg.sender,
            rewardToken,
            amount,
            deadline,
            0
        );

        bounties[id] = newBounty;
        emit BountyCreated(id, msg.sender, rewardToken, amount, deadline);
    }

    function createBountyWithEther(
        uint96 id,
        uint160 deadline
    ) external payable {
        require(bounties[id].owner == address(0), "Bounty: id already existed");
        Bounty memory newBounty = Bounty(
            id,
            msg.sender,
            address(0),
            msg.value,
            deadline,
            0
        );
        bounties[id] = newBounty;
        emit BountyCreated(id, msg.sender, address(0), msg.value, deadline);
    }

    function withdraw(uint96 id) external {
        require(
            msg.sender == bounties[id].owner,
            "BountyMaster: invalid caller"
        );
        // require(
        //     block.timestamp > bounties[id].deadline,
        //     "BountyMaster: invalid time"
        // );
        require(bounties[id].status == 0, "BountyMaster: invalid status");
        address rewardToken = bounties[id].rewardToken;
        uint256 amount = bounties[id].amount;
        if (rewardToken == address(0)) {
            payable(msg.sender).transfer(bounties[id].amount);
        } else {
            IERC20(rewardToken).transfer(msg.sender, amount);
        }
        bounties[id].status = 2;
        emit BountyWithdrawed(id, msg.sender, rewardToken, amount);
    }

    // attach reward to address
    function acceptAndPayToAddress(
        uint96 id,
        address[] memory users,
        uint256[] memory scores
    ) external {
        require(
            msg.sender == bounties[id].owner,
            "BountyMaster: invalid caller"
        );
        require(bounties[id].status == 0, "BountyMaster: invalid status");

        uint256 totalScore;
        uint256 amount = bounties[id].amount;
        address rewardToken = bounties[id].rewardToken;
        for (uint256 i = 0; i < scores.length; i++) {
            totalScore = totalScore + scores[i];
        }
        for (uint256 i = 0; i < users.length; i++) {
            uint256 amountToPay = ((amount * scores[i]) / totalScore);
            UserBounty memory userBounty = UserBounty(rewardToken, amountToPay);
            addressBounties[id][users[i]] = userBounty;
        }
        bounties[id].status = 1;

        emit BountyAccepted(id, msg.sender, 0);
    }

    // attach reward to address
    function acceptAndPayToToken(
        uint96 id,
        uint256[] memory tokenIds,
        uint256[] memory scores
    ) external {
        require(
            msg.sender == bounties[id].owner,
            "BountyMaster: invalid caller"
        );
        require(bounties[id].status == 0, "BountyMaster: invalid status");

        uint256 totalScore;
        uint256 amount = bounties[id].amount;
        address rewardToken = bounties[id].rewardToken;
        for (uint256 i = 0; i < scores.length; i++) {
            totalScore = totalScore + scores[i];
        }
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 amountToPay = ((amount * scores[i]) / totalScore);
            UserBounty memory userBounty = UserBounty(rewardToken, amountToPay);
            tokenBounties[id][tokenIds[i]] = userBounty;
        }
        bounties[id].status = 1;

        emit BountyAccepted(id, msg.sender, 1);
    }

    function getBountyById(
        uint96 id
    ) external view returns (Bounty memory bounty) {
        bounty = bounties[id];
    }

    function getUserBountyByAddress(
        uint96 id,
        address user
    ) public view returns (UserBounty memory userBounty) {
        userBounty = addressBounties[id][user];
    }

    function getUserBountyByToken(
        uint96 id,
        uint256 tokenId
    ) public view returns (UserBounty memory userBounty) {
        userBounty = tokenBounties[id][tokenId];
    }

    function getTotalUserBountyByTokens(
        uint96 id,
        uint256[] memory tokenIds
    ) public view returns (UserBounty memory totalUserBounty) {
        address rewardToken = getUserBountyByToken(id, tokenIds[0]).rewardToken;
        uint256 totalAmount;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            UserBounty memory userBounty = getUserBountyByToken(
                id,
                tokenIds[i]
            );
            require(
                userBounty.rewardToken == rewardToken,
                "BountyMaster: tokenIds with incorrect rewardToken"
            );
            totalAmount = totalAmount + userBounty.amount;
        }
        return UserBounty(rewardToken, totalAmount);
    }

    function claimUserBountyByAddress(uint96 id) external {
        require(bounties[id].status == 1, "BountyMaster: invalid status");
        UserBounty memory userBounty = getUserBountyByAddress(id, msg.sender);
        uint256 amount = userBounty.amount;
        address rewardToken = userBounty.rewardToken;
        require(amount != 0, "BountyMaster: zero balance");

        userBounty.amount = 0;
        addressBounties[id][msg.sender] = userBounty;

        if (rewardToken == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            SafeERC20.safeTransfer(IERC20(rewardToken), msg.sender, amount);
        }

        emit BountyClaimed(id, msg.sender, rewardToken, amount);
    }

    function claimUserBountyByToken(
        uint96 id,
        uint256 tokenId,
        string memory repoId,
        bytes memory tokenSig
    ) public {
        require(bounties[id].status == 1, "BountyMaster: invalid status");
        UserBounty memory userBounty = getUserBountyByToken(id, tokenId);
        uint256 amount = userBounty.amount;
        address rewardToken = userBounty.rewardToken;
        address tokenOwner;
        require(amount != 0, "BountyMaster: zero balance");

        try erc721Committable.ownerOf(tokenId) returns (address owner) {
            tokenOwner = owner;
        } catch {
            erc721Committable.mint(msg.sender, tokenId, repoId, tokenSig);
            tokenOwner = msg.sender;
        }

        userBounty.amount = 0;
        tokenBounties[id][tokenId] = userBounty;

        if (rewardToken == address(0)) {
            payable(tokenOwner).transfer(amount);
        } else {
            SafeERC20.safeTransfer(IERC20(rewardToken), tokenOwner, amount);
        }

        emit BountyClaimed(id, tokenOwner, rewardToken, amount);
    }

    function claimUserBountiesByTokens(
        uint96 id,
        uint256[] memory tokenIds,
        string[] memory repoIds,
        bytes[] memory tokenSigs
    ) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            claimUserBountyByToken(id, tokenIds[i], repoIds[i], tokenSigs[i]);
        }
    }
}
