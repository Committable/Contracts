const { expect } = require("chai");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const { tokenIds, repoIds, commits } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4 } = tokenIds;
const { repoId_a, repoId_b } = repoIds
const { Controller, DevIdentity } = require("../utils/deployer.js");
const { time } = require("console");
// const {CommittableProxy} = require("../contracts/proxy/CommittableProxy.sol")
describe('ERC721', function () {
  context('with minted tokens and initialized values', function () {
    beforeEach(async function () {
      /* get signers */
      [account1, account2] = await ethers.getSigners();
      provider = waffle.provider

      controller = await new Controller().deploy()
      devIdentity = await new DevIdentity().deploy(controller)



    })
    context("when initialized", function () {
      it("returns the correct admin address", async function () {
        expect(await controller.getProxyAdmin(devIdentity.address)).to.equal(controller.address)
      })
    })

    context("when deployed", function () {
      it("getOwner()", async function () {
        expect(await devIdentity.identityOwner(account1.address)).to.equal(account1.address)
      })
      it("changeOwner()", async function () {
        let tx = await devIdentity.connect(account1).changeOwner(account1.address, account2.address)
        await tx.wait()
        expect(await devIdentity.identityOwner(account1.address)).to.equal(account2.address)

        try {
          let tx = await devIdentity.connect(account1).changeOwner(account1.address, account1.address)
          await tx.wait()
          throw null
        } catch (err) {
          expect(err.message).to.include('DevIdentity: invalid caller');
        }
      })
      it("setAttribute()", async function () {
        let previousBlock = 0
        let name = ethers.utils.formatBytes32String("bio")
        let value = ethers.utils.hexlify(ethers.utils.toUtf8Bytes("software develoepr"))
        let validity = 60*60*24*30 // one month
        let tx = await devIdentity.setAttribute(account1.address, name, value, validity)
        let receipt = await tx.wait()
        let timestamp = (await provider.getBlock(receipt.blockNumber)).timestamp;
        await expect(tx).to.emit(devIdentity, 'DIDAttributeChanged')
          .withArgs(account1.address, name, value, timestamp+validity, previousBlock);
        
        previousBlock = receipt.blockNumber
        value = ethers.utils.hexlify(ethers.utils.toUtf8Bytes("senior develoepr"))
        tx = await devIdentity.setAttribute(account1.address, name, value, validity)
        receipt = await tx.wait()
        timestamp = (await provider.getBlock(receipt.blockNumber)).timestamp;
        await expect(tx).to.emit(devIdentity, 'DIDAttributeChanged')
          .withArgs(account1.address, name, value, timestamp+validity, previousBlock);        
      })
    })




  })


})

