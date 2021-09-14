const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const ether = require("@openzeppelin/test-helpers/src/ether");
const { ZERO_ADDRESS } = constants;
const { commitInfo_0, commitInfo_1, commitInfo_2, commitInfo_3 } = require('./commitInfo.js');
const { hashCommitInfo } = require('./utils.js');
const tokenId_0 = 5042;
const tokenId_1 = '0x79217';
const tokenId_2 = '13';
const tokenId_3 = 4;

describe('TokenProxy', function () {
  let oxERC721Upgradeable, controller, tokenProxy, signers;
  context('with minted tokens and deployed contracts', function () {
    beforeEach(async function () {
      // get signers
      [signer, user, ...others] = await ethers.getSigners();

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

      tx = await controller.setRouter(router.address);
      await tx.wait();

      // sign some tokens commit info
      let signature_0 = await signer.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_0)));
      let signature_1 = await signer.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_1)));
      let signature_2 = await signer.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_2)));
      let signature_3 = await signer.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_3)));
      // mint 0, 1, 2 to signer, 3 to user
      await tokenProxy.mint(signer.address, tokenId_0, commitInfo_0, signature_0);
      await tokenProxy.mint(signer.address, tokenId_1, commitInfo_1, signature_1);
      await tokenProxy.mint(signer.address, tokenId_2, commitInfo_2, signature_2);
      await tokenProxy.mint(user.address, tokenId_3, commitInfo_3, signature_3);

    })

    context('with legitimate batch request', function () {
      it('return batch creator address array', async function () {
        let tokenIds = [tokenId_0, tokenId_1, tokenId_2, tokenId_3];
        expect(await router.creatorOfBatch(tokenProxy.address, tokenIds))
          .deep.to.equal([signer.address, signer.address, signer.address, user.address])
      })
      it('return batch tokenIds sorted by all tokens', async function () {
        let tokenIds = [tokenId_0, tokenId_1, tokenId_2, tokenId_3];
        let tokenIds_bn = tokenIds.map((tokenId) => { return ethers.BigNumber.from(tokenId) });
        expect((await router.tokenByIndexBatch(tokenProxy.address, [0, 1, 2, 3])))
          .deep.to.equal(tokenIds_bn)
      })
      it('return batch tokenIds sorted by owner', async function () {
        let tokenIds_signer = [tokenId_0, tokenId_1, tokenId_2];
        let tokenIds_user = [tokenId_3];

        let tokenIds_signer_bn = tokenIds_signer.map((tokenIds_signer) => { return ethers.BigNumber.from(tokenIds_signer) });
        let tokenIds_user_bn = tokenIds_user.map((tokenIds_user) => { return ethers.BigNumber.from(tokenIds_user) });

        expect((await router.tokenOfOwnerByIndexBatch(tokenProxy.address, signer.address, [0, 1, 2])))
          .deep.to.equal(tokenIds_signer_bn)
        expect((await router.tokenOfOwnerByIndexBatch(tokenProxy.address, user.address, [0])))
          .deep.to.equal(tokenIds_user_bn)
                })
    })






  })










})




