const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const ether = require("@openzeppelin/test-helpers/src/ether");
const { ZERO_ADDRESS } = constants;

const firstTokenId = 5042;
const secondTokenId = '0x79217';
const nonExistentTokenId = '13';
const fourthTokenId = 4;

describe('TokenProxy', function () {
  let oxERC721Upgradeable, proxyController, tokenProxy, signers;
  context('with minted tokens and initialized values', function () {
    beforeEach(async function () {
      // get signers
      [owner, recipient, approved, operator, batchOwner, ...others] = await ethers.getSigners();

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
      const tokenId = firstTokenId;
      it('returns the owner of the given token Id', async function () {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(owner.address);
      })
    })
    context('when the given token ID was not tracked by this token', function () {
      const tokenId = nonExistentTokenId;
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
      const tokenId = firstTokenId;
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
      const tokenId = firstTokenId;
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
      const tokenId = firstTokenId;
      const data = '0x42';
      beforeEach(async function () {
        let tx = await tokenProxy.setApprovalForAll(operator.address, true);
        await tx.wait();
        tx = await tokenProxy.connect(operator).transferFrom(owner.address, recipient.address, tokenId);
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


    context('when minting additional tokens', function () {
      // two tokens have been minted to owner address, here we mint addtional four tokens to another address
      let tokenIds = ['33', '2', '3334', '0x11'];

      context('when minting 4 additional tokens to batchOwner', function () {
        beforeEach('', async function() {
          for (let i = 0; i < tokenIds.length; i++) {
            let tx = await tokenProxy['safeMint(address,uint256)'](batchOwner.address, tokenIds[i]);
            await tx.wait();
          }
        })
        it('return batch creator address array', async function() {
          expect(await tokenProxy.creatorOfBatch(tokenIds))
            .deep.to.equal([batchOwner.address, batchOwner.address, batchOwner.address, batchOwner.address])
        })
        it('return batch old-minted tokenIds sorted by all tokens', async function() {
          let tokenIds_original_bn = [firstTokenId, secondTokenId].map((tokenId) => { return ethers.BigNumber.from(tokenId) });
          expect((await tokenProxy.tokenByIndexBatch([0, 1])))
            .deep.to.equal(tokenIds_original_bn)
        })
        it('return batch new-minted tokenIds sorted by all tokens', async function() {
          let tokenIds_bn = tokenIds.map((tokenId) => { return ethers.BigNumber.from(tokenId) });
          expect((await tokenProxy.tokenByIndexBatch([2, 3, 4, 5])))
            .deep.to.equal(tokenIds_bn)
        })
        it('return batch old-minted tokenIds sorted by owner', async function() {
          let tokenIds_original_bn = [firstTokenId, secondTokenId].map((tokenId) => { return ethers.BigNumber.from(tokenId) });
          expect((await tokenProxy.tokenOfOwnerByIndexBatch(owner.address, [0, 1])))
          .deep.to.equal(tokenIds_original_bn)
        })
        it('return batch new-minted tokenIds sorted by owner', async function() {
          let tokenIds_bn = tokenIds.map((tokenId) => { return ethers.BigNumber.from(tokenId) });
          expect((await tokenProxy.tokenOfOwnerByIndexBatch(batchOwner.address, [0, 1, 2, 3])))
          .deep.to.equal(tokenIds_bn)
        })
      })

    })



  })


})

