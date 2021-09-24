const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BN, constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const ether = require("@openzeppelin/test-helpers/src/ether");
const { ZERO_ADDRESS } = constants;
const { tokenIds, projects, commits } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4 } = tokenIds;

describe('TokenProxy', function () {
  context('with minted tokens and initialized values', function () {
    beforeEach(async function () {
      /* get signers */
      [owner, recipient, approved, operator, batchOwner, ...others] = await ethers.getSigners();
      /* deploy controller contract */
      let Controller = await ethers.getContractFactory("Controller");
      controller = await Controller.deploy();
      await controller.deployed();
      /* deploy token logic contract */
      OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
      oxERC721Upgradeable = await OxERC721Upgradeable.deploy();
      await oxERC721Upgradeable.deployed();
      /* deploy token proxy contract */
      let TokenProxy = await ethers.getContractFactory("TokenProxy");
      let ABI = ["function initialize(string,string,address)"];
      let iface = new ethers.utils.Interface(ABI);
      let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
      tokenProxy = await TokenProxy.deploy(oxERC721Upgradeable.address, controller.address, calldata);
      await tokenProxy.deployed();
      /* attach token proxy contract with logic contract abi */
      tokenProxy = await OxERC721Upgradeable.attach(tokenProxy.address)
      /* sign some tokenId */
      let abiCoder = new ethers.utils.AbiCoder;
      let signature_0 = await owner.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_0])));
      let signature_1 = await owner.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_1])));
      /* mint tokenId_0, tokenId_1 to owner */
      let tx = await tokenProxy.mint(owner.address, tokenId_0, signature_0);
      await tx.wait();
      tx = await tokenProxy.mint(owner.address, tokenId_1, signature_1);
      await tx.wait();
    })
    context("when initialized", function () {
      it("returns the correct name and symbol", async function () {
        expect(await tokenProxy.name()).to.equal(NAME);
        expect(await tokenProxy.symbol()).to.equal(SYMBOL);
      })
    })
    context('when the given address owns some tokens', function () {
      it("returns the amount of tokens owned by the given address", async function () {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('2');
      })
    })
    context('when the given address does not own any tokens', function () {
      it('returns 0', async function () {
        expect(await tokenProxy.balanceOf(approved.address)).to.equal('0');
      })
    })
    context('when querying the zero address', function () {
      it('throw', async function () {
        try {
          await tokenProxy.balanceOf(ZERO_ADDRESS);
          throw null;
        } catch (err) {
          expect(err.message).to.include('ERC721: balance query for the zero address');
        }
      })
    })

    context('when the given token ID was tracked by this token', function () {
      const tokenId = tokenId_0;
      it('returns the owner of the given token Id', async function () {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(owner.address);
      })
    })
    context('when the given token ID was not tracked by this token', function () {
      const tokenId = tokenId_2;
      it('revert', async function () {
        try {
          await tokenProxy.ownerOf(tokenId);
          throw null;
        } catch (err) {
          expect(err.message).to.include('ERC721: owner query for nonexistent token');
        }
      })
    })

    context('with the given token ID being sent by owner', function () {
      const tokenId = tokenId_0;
      const data = '0x42';
      beforeEach(async function () {
        let tx = await tokenProxy.transferFrom(owner.address, recipient.address, tokenId);
        await tx.wait();
      })

      it('transfers the ownership of the given tokenID to the given address', async function () {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(recipient.address);
      })
      it('adjust owner balance and recipient balance', async function () {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('1');
        expect(await tokenProxy.balanceOf(recipient.address)).to.equal('1');
      })
      it('adjust owners and recipient tokens by index', async function () {
        expect(await tokenProxy.tokenOfOwnerByIndex(recipient.address, 0)).to.equal(tokenId);
        expect(await tokenProxy.tokenOfOwnerByIndex(owner.address, 0)).to.not.equal(tokenId);
      })
      it('clears the approval for the tokenId', async function () {
        expect(await tokenProxy.getApproved(tokenId)).to.equal(ZERO_ADDRESS);
      })
    })

    context('with the given token ID being sent by approved address', function () {
      const tokenId = tokenId_0;
      const data = '0x42';
      beforeEach(async function () {
        let tx = await tokenProxy.approve(approved.address, tokenId);
        await tx.wait();
        tx = await tokenProxy.connect(approved).transferFrom(owner.address, recipient.address, tokenId);
      })
      it('transfers the ownership of the given tokenID to the given address', async function () {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(recipient.address);
      })
      it('adjust owner balance and recipient balance', async function () {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('1');
        expect(await tokenProxy.balanceOf(recipient.address)).to.equal('1');
      })
      it('adjust owners and recipient tokens by index', async function () {
        expect(await tokenProxy.tokenOfOwnerByIndex(recipient.address, 0)).to.equal(tokenId);
        expect(await tokenProxy.tokenOfOwnerByIndex(owner.address, 0)).to.not.equal(tokenId);
      })
      it('clears the approval for the tokenId', async function () {
        expect(await tokenProxy.getApproved(tokenId)).to.equal(ZERO_ADDRESS);
      })
    })

    context('with the given token ID being sent by operator', function () {
      const tokenId = tokenId_0;
      const data = '0x42';
      beforeEach(async function () {
        let tx = await tokenProxy.setApprovalForAll(operator.address, true);
        await tx.wait();
        tx = await tokenProxy.connect(operator).transferFrom(owner.address, recipient.address, tokenId);
        await tx.wait();
      })
      it('transfers the ownership of the given tokenID to the given address', async function () {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(recipient.address);
      })
      it('adjust owner balance and recipient balance', async function () {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('1');
        expect(await tokenProxy.balanceOf(recipient.address)).to.equal('1');
      })
      it('adjust owners and recipient tokens by index', async function () {
        expect(await tokenProxy.tokenOfOwnerByIndex(recipient.address, 0)).to.equal(tokenId);
        expect(await tokenProxy.tokenOfOwnerByIndex(owner.address, 0)).to.not.equal(tokenId);
      })
      it('clears the approval for the tokenId', async function () {
        expect(await tokenProxy.getApproved(tokenId)).to.equal(ZERO_ADDRESS);
      })
    })
  })


})

