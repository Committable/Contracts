const { expect } = require("chai");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const { tokenIds, repoIds, commits } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4 } = tokenIds;
const { repoId_a, repoId_b } = repoIds
const { Controller, DevIdentity } = require("../utils/deployer.js")
// const {CommittableProxy} = require("../contracts/proxy/CommittableProxy.sol")
describe('ERC721', function () {
  context('with minted tokens and initialized values', function () {
    beforeEach(async function () {
      /* get signers */
      [account1, account2] = await ethers.getSigners();

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
        tx.wait()
        expect(await devIdentity.identityOwner(account1.address)).to.equal(account2.address)

        try {
          let tx = await devIdentity.connect(account1).changeOwner(account1.address, account1.address)
          tx.wait()
          throw null
        } catch (err) {
          expect(err.message).to.include('DevIdentity: invalid caller');
        }
      })
      it("setAttribute()", async function () {
        let name = ethers.utils.formatBytes32String("bio")
        let value = ethers.utils.toUtf8Bytes("software develoepr")
        console.log(name)
        console.log(value)

        let tx = await devIdentity.setAttribute(account1.address, name, value, 1000)
        tx.wait()
        await expect(tx).to.emit(devIdentity, 'DIDAttributeChanged')
        .withArgs(account1.address, name, value, 1000, 0);
      })
    })




  })


})

