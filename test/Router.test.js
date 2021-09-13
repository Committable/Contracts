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
  let oxERC721Upgradeable, controller, tokenProxy, signers;
  context('with minted tokens and initialized values', function () {
    beforeEach(async function () {
      // get signers
      [owner, recipient, approved, operator, batchOwner, ...others] = await ethers.getSigners();

      // deploy contracts here
      OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
      oxERC721Upgradeable = await OxERC721Upgradeable.deploy();
      await oxERC721Upgradeable.deployed();

      let Controller = await ethers.getContractFactory("Controller");
      controller = await Controller.deploy();
      await controller.deployed();

      let TokenProxy = await ethers.getContractFactory("TokenProxy");
      let ABI = ["function initialize(string,string,address)"];
      let iface = new ethers.utils.Interface(ABI);
      let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
      tokenProxy = await TokenProxy.deploy(oxERC721Upgradeable.address, controller.address, calldata);
      await tokenProxy.deployed();
      tokenProxy = await OxERC721Upgradeable.attach(tokenProxy.address);

      let Router = await ethers.getContractFactory("Router");
      router = await Router.deploy(controller.address);
      await router.deployed();

      let Exchange = await ethers.getContractFactory("Exchange");
      exchange = await Exchange.deploy(controller.address);
      await exchange.deployed();

      let tx = await controller.grantAuthentication(exchange.address);
      await tx.wait();
      tx = await controller.setRouter(router.address);
      await tx.wait();

      tx = await tokenProxy['safeMint(address,uint256)'](owner.address, firstTokenId);
      await tx.wait();
      tx = await tokenProxy['safeMint(address,uint256)'](owner.address, secondTokenId);
      await tx.wait();



    })

    context('when minting additional tokens', function () {
      // two tokens have been minted to owner address, here we mint addtional four tokens to another address
      let tokenIds = ['33', '2', '3334', '0x11'];

      context('when minting 4 additional tokens to batchOwner', function () {
        beforeEach('', async function () {
          for (let i = 0; i < tokenIds.length; i++) {
            let tx = await tokenProxy['safeMint(address,uint256)'](batchOwner.address, tokenIds[i]);
            await tx.wait();
          }
        })
        it('return batch creator address array', async function () {
          expect(await router.creatorOfBatch(tokenProxy.address, tokenIds))
            .deep.to.equal([batchOwner.address, batchOwner.address, batchOwner.address, batchOwner.address])
        })
        it('return batch old-minted tokenIds sorted by all tokens', async function () {
          let tokenIds_original_bn = [firstTokenId, secondTokenId].map((tokenId) => { return ethers.BigNumber.from(tokenId) });
          expect((await router.tokenByIndexBatch(tokenProxy.address, [0, 1])))
            .deep.to.equal(tokenIds_original_bn)
        })
        it('return batch new-minted tokenIds sorted by all tokens', async function () {
          let tokenIds_bn = tokenIds.map((tokenId) => { return ethers.BigNumber.from(tokenId) });
          expect((await router.tokenByIndexBatch(tokenProxy.address, [2, 3, 4, 5])))
            .deep.to.equal(tokenIds_bn)
        })
        it('return batch old-minted tokenIds sorted by owner', async function () {
          let tokenIds_original_bn = [firstTokenId, secondTokenId].map((tokenId) => { return ethers.BigNumber.from(tokenId) });
          expect((await router.tokenOfOwnerByIndexBatch(tokenProxy.address, owner.address, [0, 1])))
            .deep.to.equal(tokenIds_original_bn)
        })
        it('return batch new-minted tokenIds sorted by owner', async function () {
          let tokenIds_bn = tokenIds.map((tokenId) => { return ethers.BigNumber.from(tokenId) });
          expect((await router.tokenOfOwnerByIndexBatch(tokenProxy.address, batchOwner.address, [0, 1, 2, 3])))
            .deep.to.equal(tokenIds_bn)
        })
      })

    })






  })










})




