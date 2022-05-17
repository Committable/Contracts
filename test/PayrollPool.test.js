const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;

describe('PayrollPool', function () {
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
      controller = await Controller.deploy(creator.address);
      await controller.deployed();
      tx = await controller.setSigner(signer.address);
      await tx.wait()
      /* deploy payrollPool */
      let PayrollPool = await ethers.getContractFactory("PayrollPool");
      payrollPool = await PayrollPool.deploy(controller.address);
      await payrollPool.deployed();
      /* deploy erc20 and approve for test */
      let ERC20 = await ethers.getContractFactory("USDTMock");
      token = await ERC20.connect(creator).deploy("USDTMock", "USDT-M");
      await token.deployed();
      tx = await token.approve(payrollPool.address, ethers.utils.parseEther('10000').toString());
      await tx.wait();
      /* get block info */
      blockInfo = await ethers.provider.getBlock("latest");
      /* create an airdrop */
      start = '0';
      end = '10000000000'
      // current is around'1643013611'
      rewardAmount = '10000'
      tx = await payrollPool.create(0, token.address, rewardAmount, start, end);
      await tx.wait()
      /* sign a user airdrop */
      abiCoder = new ethers.utils.AbiCoder();
      index = '0'
      claimAmount = '100'
      hash = ethers.utils.keccak256(abiCoder.encode(['uint256', 'uint256', 'address'], [index, claimAmount, user.address]));
      sig = await signer.signMessage(ethers.utils.arrayify(hash));
    })

    it('should return poolInfo', async function () {
      let result = await payrollPool.getPoolInfo(0);
      expect(result.creator).to.equal(creator.address);
      expect(result.rewardToken).to.equal(token.address);
      expect(result.rewardAmount).to.equal(rewardAmount);
      expect(result.unclaimedAmount).to.equal(rewardAmount);
      expect(result.start).to.equal(start);
      expect(result.end).to.equal(end);
    })
    it('should create airdrop successfully', async function () {
      let tx = await payrollPool.create(1, token.address, rewardAmount, start, end);
      expect(tx).to.emit(payrollPool, 'PoolCreated').withArgs(1, token.address, rewardAmount,creator.address, start, end);
    })
    it('should claim airdrop successfully', async function () {
      let tx = await payrollPool.connect(user).claim(index, claimAmount, sig);
      expect(tx).to.emit(payrollPool, 'RewardClaimed').withArgs(index, token.address, claimAmount, user.address);
      expect(tx).to.emit(token, 'Transfer').withArgs(payrollPool.address, user.address, claimAmount);
      await tx.wait()
      let poolInfo = await payrollPool.getPoolInfo(index);
      expect(poolInfo.unclaimedAmount).to.equal(poolInfo.rewardAmount.sub(claimAmount));
      let userInfo = await payrollPool.getUserInfo(index, user.address);
      expect(userInfo).to.equal(true)
    })
    it('cannot claim twice', async function () {
      let tx = await payrollPool.connect(user).claim(index, claimAmount, sig);
      await tx.wait();
      try {
        await payrollPool.connect(user).claim(index, claimAmount, sig);
      } catch (err) {
        expect(err.message).to.include("claim once only")
      }
    })
    it('cannot claim with invalid sig', async function () {
      let invalidSig = await user.signMessage(ethers.utils.arrayify(hash));
      try {
        let tx = await payrollPool.connect(user).claim(index, claimAmount, invalidSig);
        await tx.wait();
        throw null;
      } catch (err) {
        expect(err.message).to.include("invalid signature")
      }
    })
    it('cannot claim amount that succeed unclaimed amount', async function () {
      /* sign a user airdrop */
      let index = '0'
      let claimAmount = '100000'
      let hash = ethers.utils.keccak256(abiCoder.encode(['uint256', 'uint256', 'address'], [index, claimAmount, user.address]));
      let sig = await signer.signMessage(ethers.utils.arrayify(hash));
      try {
        let tx = await payrollPool.connect(user).claim(index, claimAmount, sig)
        await tx.wait()
        throw null;
      } catch (err) {
        expect(err.message).to.include('underflowed');
      }
    })
    it("should revert when query of non-existence pool", async function () {
      /* sign a user airdrop */
      let index = '1'
      let claimAmount = '10000'
      let hash = ethers.utils.keccak256(abiCoder.encode(['uint256', 'uint256', 'address'], [index, claimAmount, user.address]));
      let sig = await signer.signMessage(ethers.utils.arrayify(hash));
      try {
        let tx = await payrollPool.connect(user).claim(index, claimAmount, sig)
        await tx.wait()
        throw null;
      } catch (err) {
        expect(err.message).to.include('query of non-existence pool');
      }
    })
    it("should revert with calling address 0 when creating", async function() {
      try {
        let tx = await payrollPool.create(1, ZERO_ADDRESS, rewardAmount, start, end);
        await tx.wait();
        throw null
      } catch(err) {
        expect(err.message).to.include('Address: call to non-contract');
      }
    })
    it("should revert with duplicated index", async function () {
     
      try {
        tx = await payrollPool.create(0, token.address, rewardAmount, start, end);
        await tx.wait()
        throw null;
      } catch (err) {
        expect(err.message).to.include('pool already exists');
      }
    })
    /** from this unit, we manipulate timestamp to overdue */
    it('should be able to claim unclaimed token after end-time', async function () {
      /* set network block timestamp to end-time */
      await network.provider.send("evm_setNextBlockTimestamp", [10000000000])
      let poolInfo = await payrollPool.getPoolInfo(index);
      let unclaimedAmount = poolInfo.unclaimedAmount;
      let tx = await payrollPool.connect(creator).withdraw(index);
      expect(tx).to.emit(payrollPool, 'RewardClaimed').withArgs(index, token.address, unclaimedAmount, creator.address);
      expect(tx).to.emit(token, 'Transfer').withArgs(payrollPool.address, creator.address, unclaimedAmount);
      poolInfo = await payrollPool.getPoolInfo(index);
      unclaimedAmount = poolInfo.unclaimedAmount;
      expect(unclaimedAmount).to.equal(0)
    })
    it('should revert when claim airdrop after end-time', async function () {
      /* set network block timestamp to end-time */
      // await network.provider.send("evm_setNextBlockTimestamp", [10000000000])
      try {
        let tx = await payrollPool.connect(user).claim(index, claimAmount, sig);
        await tx.wait()
        throw null
      } catch(err) {
        // console.log(err.message)
        expect(err.message).to.include('invalid timestamp')
      }
    })
  })
})

