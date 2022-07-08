const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const { Controller, PayrollPool } = require("../utils/deployer.js")

describe('PayrollPool', function () {
  context('with erc20 payroll pool', function () {
    beforeEach(async function () {

      /* get signers */
      [creator, signer, user, ...others] = await ethers.getSigners();


      controller = await new Controller().deploy(signer.address)
      payrollProxy = await new PayrollPool().deploy(controller)

      /* deploy erc20 and approve for test */
      let ERC20 = await ethers.getContractFactory("USDTMock");
      token = await ERC20.connect(creator).deploy("USDTMock", "USDT-M");
      await token.deployed();
      tx = await token.approve(payrollProxy.address, ethers.utils.parseEther('10000').toString());
      await tx.wait();

      /* get block info */
      blockInfo = await ethers.provider.getBlock("latest");
      /* create an payroll */
      start = '0';
      end = '10000000000'
      // current is around'1643013611'
      rewardAmount = '10000'
      tx = await payrollProxy.create(0, token.address, rewardAmount, start, end);
      await tx.wait()
      /* sign a user payroll */
      abiCoder = new ethers.utils.AbiCoder();
      index = '0'
      claimAmount = '100'


  

      claim = {
        index: index,
        amount: claimAmount,
        user: user.address
      }


      // hash = ethers.utils.keccak256(abiCoder.encode(['uint256', 'uint256', 'address'], [index, claimAmount, user.address]));
      // sig = await signer.signMessage(ethers.utils.arrayify(hash));

      sig = await signer._signTypedData(payrollProxy.domain, payrollProxy.types, claim)


      // console.log(payrollProxy.DOMAIN_SEPARATOR())
    })
    it('cannot initialize twice', async function () {
      try {
        await payrollProxy.initialize(controller.address)
        throw null
      } catch (err) {
        expect(err.message).to.include("Initializable: contract is already initialized")
      }

    })
    it('should return poolInfo', async function () {
      let result = await payrollProxy.getPoolInfo(0);
      expect(result.creator).to.equal(creator.address);
      expect(result.rewardToken).to.equal(token.address);
      expect(result.rewardAmount).to.equal(rewardAmount);
      expect(result.unclaimedAmount).to.equal(rewardAmount);
      expect(result.start).to.equal(start);
      expect(result.end).to.equal(end);
    })
    it('should create payroll successfully', async function () {
      let tx = await payrollProxy.create(1, token.address, rewardAmount, start, end);
      await expect(tx).to.emit(payrollProxy, 'PoolCreated').withArgs(1, token.address, rewardAmount, creator.address, start, end);
    })
    it('cannot create erc20 payroll while sending ethers', async function () {
      try {
        let tx = await payrollProxy.create(1, token.address, rewardAmount, start, end, { value: '1' });
        await tx.wait()
        throw null
      } catch (err) {
        expect(err.message).to.include("sending ether with erc20 not allowed")
      }
    })
    it('should claim payroll successfully', async function () {
      let preBalance = await token.balanceOf(user.address)

      let tx = await payrollProxy.connect(user).claim(index, claimAmount, sig);
      await expect(tx).to.emit(payrollProxy, 'RewardClaimed').withArgs(index, token.address, claimAmount, user.address);
      await expect(tx).to.emit(token, 'Transfer').withArgs(payrollProxy.address, user.address, claimAmount);
      await tx.wait()
      let poolInfo = await payrollProxy.getPoolInfo(index);
      expect(poolInfo.unclaimedAmount).to.equal(poolInfo.rewardAmount.sub(claimAmount));
      let userInfo = await payrollProxy.getUserInfo(index, user.address);
      expect(userInfo).to.equal(true)

      let afterBalance = await token.balanceOf(user.address)

      expect(afterBalance.sub(preBalance)).to.equal(claimAmount)
    })
    it('cannot claim twice', async function () {
      let tx = await payrollProxy.connect(user).claim(index, claimAmount, sig);
      await tx.wait();
      try {
        await payrollProxy.connect(user).claim(index, claimAmount, sig);
      } catch (err) {
        expect(err.message).to.include("claim once only")
      }
    })
    it('cannot claim with invalid sig', async function () {

      let invalidSig = await user._signTypedData(payrollProxy.domain, payrollProxy.types, claim)
      try {
        let tx = await payrollProxy.connect(user).claim(index, claimAmount, invalidSig);
        await tx.wait();
        throw null;
      } catch (err) {
        expect(err.message).to.include("invalid signature")
      }
    })
    it('cannot claim amount that succeed unclaimed amount', async function () {
      /* sign a user payroll */
      let claim = {
        index: '0',
        amount: '100000',
        user: user.address
      }

      let sig = await signer._signTypedData(payrollProxy.domain, payrollProxy.types, claim)
      try {
        let tx = await payrollProxy.connect(user).claim(claim.index, claim.amount, sig)
        await tx.wait()
        throw null;
      } catch (err) {
         expect(err.message).to.include('underflowed');
      }
    })
    it("should revert when query of non-existence pool", async function () {
      /* sign a user claim */
      let claim = {
        index: '1',
        amount: '10000',
        user: user.address
      }
      let sig = await signer._signTypedData(payrollProxy.domain, payrollProxy.types, claim)

      try {
        let tx = await payrollProxy.connect(user).claim(claim.index, claim.amount, sig)
        await tx.wait()
        throw null;
      } catch (err) {
        expect(err.message).to.include('query of non-existence pool');
      }
    })

    it("should revert with duplicated index", async function () {

      try {
        tx = await payrollProxy.create(0, token.address, rewardAmount, start, end);
        await tx.wait()
        throw null;
      } catch (err) {
        expect(err.message).to.include('pool already exists');
      }
    })
    // /** from this unit, we manipulate timestamp to overdue */
    // it('should be able to claim unclaimed token after end-time', async function () {
    //   /* set network block timestamp to end-time */
    //   await network.provider.send("evm_setNextBlockTimestamp", [10000000000])
    //   let poolInfo = await payrollProxy.getPoolInfo(index);
    //   let unclaimedAmount = poolInfo.unclaimedAmount;
    //   let tx = await payrollProxy.connect(creator).withdraw(index);
    //   expect(tx).to.emit(payrollProxy, 'RewardClaimed').withArgs(index, token.address, unclaimedAmount, creator.address);
    //   expect(tx).to.emit(token, 'Transfer').withArgs(payrollProxy.address, creator.address, unclaimedAmount);
    //   poolInfo = await payrollProxy.getPoolInfo(index);
    //   unclaimedAmount = poolInfo.unclaimedAmount;
    //   expect(unclaimedAmount).to.equal(0)
    // })
    // it('should revert when claim payroll after end-time', async function () {
    //   /* set network block timestamp to end-time */
    //   // await network.provider.send("evm_setNextBlockTimestamp", [10000000000])
    //   try {
    //     let tx = await payrollProxy.connect(user).claim(index, claimAmount, sig);
    //     await tx.wait()
    //     throw null
    //   } catch (err) {
    //     // console.log(err.message)
    //     expect(err.message).to.include('invalid timestamp')
    //   }
    // })
  })
  context('with eth payroll pool', function () {
    beforeEach(async function () {

      /* get signers */
      [creator, signer, user, ...others] = await ethers.getSigners();

      controller = await new Controller().deploy(signer.address)
      payrollProxy = await new PayrollPool().deploy(controller)



      /* get block info */
      blockInfo = await ethers.provider.getBlock("latest");
      /* create an payroll */
      start = '0';
      end = '10000000000'
      // current is around'1643013611'
      rewardAmount = '10000'
      tx = await payrollProxy.create(0, ZERO_ADDRESS, rewardAmount, start, end, { value: rewardAmount });
      await tx.wait()
      /* sign a user payroll */
      abiCoder = new ethers.utils.AbiCoder();
      index = '0'
      claimAmount = '100'


      /* caculate payrollProxy.domain seperator and type */
      payrollProxy.domain = {
        name: 'PayrollPool',
        version: '1',
        chainId: 1337, // hardhat chainid
        verifyingContract: payrollProxy.address // assign this value accordingly
      };

      payrollProxy.types = {
        Claim: [
          { name: 'index', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'user', type: 'address' },
        ]
      };

      claim = {
        index: index,
        amount: claimAmount,
        user: user.address
      }


      // hash = ethers.utils.keccak256(abiCoder.encode(['uint256', 'uint256', 'address'], [index, claimAmount, user.address]));
      // sig = await signer.signMessage(ethers.utils.arrayify(hash));

      sig = await signer._signTypedData(payrollProxy.domain, payrollProxy.types, claim)


      // console.log(payrollProxy.DOMAIN_SEPARATOR())
    })
    it('cannot initialize twice', async function () {
      try {

        await payrollProxy.initialize(controller.address)
        throw null
      } catch (err) {
        expect(err.message).to.include("Initializable: contract is already initialized")
      }

    })
    it('should return poolInfo', async function () {
      let result = await payrollProxy.getPoolInfo(0);
      expect(result.creator).to.equal(creator.address);
      expect(result.rewardToken).to.equal(ZERO_ADDRESS);
      expect(result.rewardAmount).to.equal(rewardAmount);
      expect(result.unclaimedAmount).to.equal(rewardAmount);
      expect(result.start).to.equal(start);
      expect(result.end).to.equal(end);
    })
    it('should create payroll successfully', async function () {
      let tx = await payrollProxy.create(1, ZERO_ADDRESS, rewardAmount, start, end, { value: rewardAmount });
      expect(tx).to.emit(payrollProxy, 'PoolCreated').withArgs(1, ZERO_ADDRESS, rewardAmount, creator.address, start, end);
    })
    it('should revert when create payroll without ether', async function () {
      try {
        let tx = await payrollProxy.create(1, ZERO_ADDRESS, rewardAmount, start, end);
        await tx.wait()
        throw null
      } catch (err) {
        expect(err.message).to.include("insufficient ether")

      }
    })

    it('should claim payroll successfully', async function () {
      let preBalance = await user.getBalance()
      let tx = await payrollProxy.connect(user).claim(index, claimAmount, sig);
      expect(tx).to.emit(payrollProxy, 'RewardClaimed').withArgs(index, ZERO_ADDRESS, claimAmount, user.address);
      expect(tx).to.emit(token, 'Transfer').withArgs(payrollProxy.address, user.address, claimAmount);
      // await tx.wait()
      gasUsed = (await tx.wait()).gasUsed;

      let poolInfo = await payrollProxy.getPoolInfo(index);
      expect(poolInfo.unclaimedAmount).to.equal(poolInfo.rewardAmount.sub(claimAmount));
      let userInfo = await payrollProxy.getUserInfo(index, user.address);
      expect(userInfo).to.equal(true)

      gasPrice = tx.gasPrice;
      gasFee = gasPrice.mul(gasUsed);

      let afterBalance = await user.getBalance()

      expect(afterBalance.add(gasFee).sub(preBalance)).to.equal(claimAmount)
    })
    it('cannot claim twice', async function () {
      let tx = await payrollProxy.connect(user).claim(index, claimAmount, sig);
      await tx.wait();
      try {
        await payrollProxy.connect(user).claim(index, claimAmount, sig);
      } catch (err) {
        expect(err.message).to.include("claim once only")
      }
    })
    it('cannot claim with invalid sig', async function () {

      let invalidSig = await user._signTypedData(payrollProxy.domain, payrollProxy.types, claim)
      try {
        let tx = await payrollProxy.connect(user).claim(index, claimAmount, invalidSig);
        await tx.wait();
        throw null;
      } catch (err) {
        expect(err.message).to.include("invalid signature")
      }
    })
    it('cannot claim amount that succeed unclaimed amount', async function () {
      /* sign a user payroll */
      let claim = {
        index: '0',
        amount: '100000',
        user: user.address
      }

      let sig = await signer._signTypedData(payrollProxy.domain, payrollProxy.types, claim)
      try {
        let tx = await payrollProxy.connect(user).claim(claim.index, claim.amount, sig)
        await tx.wait()
        throw null;
      } catch (err) {
        expect(err.message).to.include('underflowed');
      }
    })
    it("should revert when query of non-existence pool", async function () {
      /* sign a user claim */
      let claim = {
        index: '1',
        amount: '10000',
        user: user.address
      }
      let sig = await signer._signTypedData(payrollProxy.domain, payrollProxy.types, claim)

      try {
        let tx = await payrollProxy.connect(user).claim(claim.index, claim.amount, sig)
        await tx.wait()
        throw null;
      } catch (err) {
        expect(err.message).to.include('query of non-existence pool');
      }
    })

    it("should revert with duplicated index", async function () {

      try {
        tx = await payrollProxy.create(0, ZERO_ADDRESS, rewardAmount, start, end);
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
      let poolInfo = await payrollProxy.getPoolInfo(index);
      let unclaimedAmount = poolInfo.unclaimedAmount;
      let tx = await payrollProxy.connect(creator).withdraw(index);
      expect(tx).to.emit(payrollProxy, 'RewardClaimed').withArgs(index, ZERO_ADDRESS, unclaimedAmount, creator.address);
      expect(tx).to.emit(token, 'Transfer').withArgs(payrollProxy.address, creator.address, unclaimedAmount);
      poolInfo = await payrollProxy.getPoolInfo(index);
      unclaimedAmount = poolInfo.unclaimedAmount;
      expect(unclaimedAmount).to.equal(0)
    })
    it('should revert when claim payroll after end-time', async function () {
      /* set network block timestamp to end-time */
      // await network.provider.send("evm_setNextBlockTimestamp", [10000000000])
      try {
        let tx = await payrollProxy.connect(user).claim(index, claimAmount, sig);
        await tx.wait()
        throw null
      } catch (err) {
        // console.log(err.message)
        expect(err.message).to.include('invalid timestamp')
      }
    })
  })
})

