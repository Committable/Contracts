const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;

describe('AirdropPool', function () {
  context('with deployed contracts', function () {
    beforeEach(async function () {

      /* get signers */
      [creator, signer, user, ...others] = await ethers.getSigners();
      /* deploy helper */
      const Helper = await ethers.getContractFactory('Helper');
      helper = await Helper.deploy();
      await helper.deployed();
      /* deploy controller contract */
      let Controller = await ethers.getContractFactory("Controller");
      controller = await Controller.deploy();
      await controller.deployed();
      tx = await controller.setSigner(signer.address);
      await tx.wait()
      /* deploy airdropPool */
      let AirdropPool = await ethers.getContractFactory("AirdropPool");
      airdropPool = await AirdropPool.deploy(controller.address);
      await airdropPool.deployed();
      /* deploy erc20 and approve for test */
      let ERC20 = await ethers.getContractFactory("ERC20Test");
      token = await ERC20.connect(creator).deploy("Tether", "USDT");
      await token.deployed();
      tx = await token.approve(airdropPool.address, ethers.utils.parseEther('10000').toString());
      await tx.wait();
      /* get block info */
      blockInfo = await ethers.provider.getBlock("latest");
      /* create an airdrop */
      start = '0';
      end = '10000000000'
      // current = '1643013611'
      rewardAmount = '10000'
      tx = await airdropPool.create(0, token.address, rewardAmount, start, end);
      await tx.wait()
      /* sign a user airdrop */
      abiCoder = new ethers.utils.AbiCoder();
      index = '0'
      claimAmount = '100'
      hash = ethers.utils.keccak256(abiCoder.encode(['uint256', 'uint256', 'address'], [index, claimAmount, user.address]));
      sig = await signer.signMessage(ethers.utils.arrayify(hash));
    })

    it.only('should return poolInfo', async function () {
      let result = await airdropPool.getPoolInfo(0);
      expect(result.creator).to.equal(creator.address);
      expect(result.rewardToken).to.equal(token.address);
      expect(result.rewardAmount).to.equal(rewardAmount);
      expect(result.unclaimedAmount).to.equal(rewardAmount);
      expect(result.start).to.equal(start);
      expect(result.end).to.equal(end);
    })
    it.only('should claim airdrop successfully', async function () {
      let tx = await airdropPool.connect(user).claim(index, claimAmount, sig);
      expect(tx).to.emit(airdropPool, 'RewardClaimed').withArgs(index, token.address, claimAmount, user.address);
      expect(tx).to.emit(token, 'Transfer').withArgs(airdropPool.address, user.address, claimAmount);
      await tx.wait()
      let poolInfo = await airdropPool.getPoolInfo(index);
      expect(poolInfo.unclaimedAmount).to.equal(poolInfo.rewardAmount.sub(claimAmount));
      let userInfo = await airdropPool.getUserInfo(index, user.address);
      expect(userInfo).to.equal(true)
    })
    it.only('cannot claim twice', async function () {
      let tx = await airdropPool.connect(user).claim(index, claimAmount, sig);
      await tx.wait();
      try {
        await airdropPool.connect(user).claim(index, claimAmount, sig);
      } catch (err) {
        expect(err.message).to.include("claim once only")
      }
    })
    it.only('cannot claim with invalid sig', async function () {
      let invalidSig = await user.signMessage(ethers.utils.arrayify(hash));
      try {
        let tx = await airdropPool.connect(user).claim(index, claimAmount, invalidSig);
        await tx.wait();
        throw null;
      } catch (err) {
        expect(err.message).to.include("invalid signature")
      }
    })
    it.only('cannot claim amount that succeed unclaimed amount', async function () {
      /* sign a user airdrop */
      let index = '0'
      let claimAmount = '100000'
      let hash = ethers.utils.keccak256(abiCoder.encode(['uint256', 'uint256', 'address'], [index, claimAmount, user.address]));
      let sig = await signer.signMessage(ethers.utils.arrayify(hash));
      try {
        let tx = await airdropPool.connect(user).claim(index, claimAmount, sig)
        await tx.wait()
        throw null;
      } catch (err) {
        expect(err.message).to.include('underflowed');
      }
    })
    it.only("should revert invalid request", async function () {
      /* sign a user airdrop */
      let index = '1'
      let claimAmount = '10000'
      let hash = ethers.utils.keccak256(abiCoder.encode(['uint256', 'uint256', 'address'], [index, claimAmount, user.address]));
      let sig = await signer.signMessage(ethers.utils.arrayify(hash));
      try {
        let tx = await airdropPool.connect(user).claim(index, claimAmount, sig)
        await tx.wait()
        throw null;
      } catch (err) {
        expect(err.message).to.include('query of non-existence pool');
      }
    })
    it.only("should revert with duplicated index", async function () {
     
      try {
        tx = await airdropPool.create(0, token.address, rewardAmount, start, end);
        await tx.wait()
        throw null;
      } catch (err) {
        expect(err.message).to.include('pool already exists');
      }
    })
    it.only('should claim unclaimed token after end-time', async function () {
      /* set network block timestamp to end-time */
      await network.provider.send("evm_setNextBlockTimestamp", [10000000000])
      let poolInfo = await airdropPool.getPoolInfo(index);
      let unclaimedAmount = poolInfo.unclaimedAmount;
      let tx = await airdropPool.connect(creator).withdraw(index);
      expect(tx).to.emit(airdropPool, 'RewardClaimed').withArgs(index, token.address, unclaimedAmount, creator.address);
      expect(tx).to.emit(token, 'Transfer').withArgs(airdropPool.address, creator.address, unclaimedAmount);
      poolInfo = await airdropPool.getPoolInfo(index);
      unclaimedAmount = poolInfo.unclaimedAmount;
      expect(unclaimedAmount).to.equal(0)
    })

  })
})