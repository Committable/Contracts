const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.setting.js');
const ether = require("@openzeppelin/test-helpers/src/ether");
const { ZERO_ADDRESS } = constants;

const firstTokenId = 5042;
const secondTokenId = '0x79217';
const nonExistentTokenId = '13';
const fourthTokenId = 4;

describe('TokenProxy', () => {
  let oxERC721Upgradeable, proxyController, tokenProxy, signers;
  context("initilizing", async () => {
    signers = await ethers.getSigners();
    [owner, recipient, approved, operator, ...others] = signers;
  })

  context('with minted tokens and initialized values', () => {
    beforeEach(async () => {
      // deploy contracts here
      OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
      oxERC721Upgradeable = await OxERC721Upgradeable.deploy();
      await oxERC721Upgradeable.deployed();

      let ProxyController = await ethers.getContractFactory("ProxyController");
      proxyController = await ProxyController.deploy();
      await proxyController.deployed();

      let TokenProxy = await ethers.getContractFactory("TokenProxy");
      let ABI = ["function initialize(string,string,address)"];
      let iface = new ethers.utils.Interface(ABI);
      let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, proxyController.address]);
      tokenProxy = await TokenProxy.deploy(oxERC721Upgradeable.address, proxyController.address, calldata);
      await tokenProxy.deployed();
      tokenProxy = await OxERC721Upgradeable.attach(tokenProxy.address);

      let tx = await tokenProxy['safeMint(address,uint256)'](owner.address, firstTokenId);
      await tx.wait();
      tx = await tokenProxy['safeMint(address,uint256)'](owner.address, secondTokenId);
      await tx.wait();
    })
    context("when initialized", () => {
      it("returns the correct name and symbol", async () => {
        expect(await tokenProxy.name()).to.equal(NAME);
        expect(await tokenProxy.symbol()).to.equal(SYMBOL);
      })
    })
    context('when the given address owns some tokens', () => {
      it("returns the amount of tokens owned by the given address", async () => {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('2');
      })
    })
    context('when the given address does not own any tokens', () => {
      it('returns 0', async () => {
        expect(await tokenProxy.balanceOf(approved.address)).to.equal('0');
      })
    })
    context('when querying the zero address', () => {
      it('throw', async () => {
        try {
          await tokenProxy.balanceOf(ZERO_ADDRESS);
          throw null;
        } catch (err) {
          expect(err.message).to.include('ERC721: balance query for the zero address');
        }
      })
    })

    context('when the given token ID was tracked by this token', () => {
      const tokenId = firstTokenId;
      it('returns the owner of the given token Id', async () => {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(owner.address);
      })
    })
    context('when the given token ID was not tracked by this token', () => {
      const tokenId = nonExistentTokenId;
      it('revert', async () => {
        try {
          await tokenProxy.ownerOf(tokenId);
          throw null;
        } catch (err) {
          expect(err.message).to.include('ERC721: owner query for nonexistent token');
        }
      })
    })

    context('with the given token ID being sent by owner', () => {
      const tokenId = firstTokenId;
      const data = '0x42';
      beforeEach(async () => {
        let tx = await tokenProxy.transferFrom(owner.address, recipient.address, tokenId);
        await tx.wait();
      })

      it('transfers the ownership of the given tokenID to the given address', async () => {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(recipient.address);
      })
      it('adjust owner balance and recipient balance', async () => {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('1');
        expect(await tokenProxy.balanceOf(recipient.address)).to.equal('1');
      })
      it('adjust owners and recipient tokens by index', async () => {
        expect(await tokenProxy.tokenOfOwnerByIndex(recipient.address, 0)).to.equal(tokenId);
        expect(await tokenProxy.tokenOfOwnerByIndex(owner.address, 0)).to.not.equal(tokenId);
      })
      it('clears the approval for the tokenId', async () => {
        expect(await tokenProxy.getApproved(tokenId)).to.equal(ZERO_ADDRESS);
      })
    })

    context('with the given token ID being sent by approved address', () => {
      const tokenId = firstTokenId;
      const data = '0x42';
      beforeEach(async () => {
        let tx = await tokenProxy.approve(approved.address, tokenId);
        await tx.wait();
        tx = await tokenProxy.connect(approved).transferFrom(owner.address, recipient.address, tokenId);
      })
      it('transfers the ownership of the given tokenID to the given address', async () => {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(recipient.address);
      })
      it('adjust owner balance and recipient balance', async () => {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('1');
        expect(await tokenProxy.balanceOf(recipient.address)).to.equal('1');
      })
      it('adjust owners and recipient tokens by index', async () => {
        expect(await tokenProxy.tokenOfOwnerByIndex(recipient.address, 0)).to.equal(tokenId);
        expect(await tokenProxy.tokenOfOwnerByIndex(owner.address, 0)).to.not.equal(tokenId);
      })
      it('clears the approval for the tokenId', async () => {
        expect(await tokenProxy.getApproved(tokenId)).to.equal(ZERO_ADDRESS);
      })
    })

    context('with the given token ID being sent by operator', () => {
      const tokenId = firstTokenId;
      const data = '0x42';
      beforeEach(async () => {
        let tx = await tokenProxy.setApprovalForAll(operator.address, true);
        await tx.wait();
        tx = await tokenProxy.connect(operator).transferFrom(owner.address, recipient.address, tokenId);
      })
      it('transfers the ownership of the given tokenID to the given address', async () => {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(recipient.address);
      })
      it('adjust owner balance and recipient balance', async () => {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('1');
        expect(await tokenProxy.balanceOf(recipient.address)).to.equal('1');
      })
      it('adjust owners and recipient tokens by index', async () => {
        expect(await tokenProxy.tokenOfOwnerByIndex(recipient.address, 0)).to.equal(tokenId);
        expect(await tokenProxy.tokenOfOwnerByIndex(owner.address, 0)).to.not.equal(tokenId);
      })
      it('clears the approval for the tokenId', async () => {
        expect(await tokenProxy.getApproved(tokenId)).to.equal(ZERO_ADDRESS);
      })
    })




    

  })


})

