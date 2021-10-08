const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BN, constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const ether = require("@openzeppelin/test-helpers/src/ether");
const { ZERO_ADDRESS } = constants;
const { hashCommitInfo } = require('./utils.js');
const { tokenIds, commitInfo } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4 } = tokenIds;


describe('Router', function () {
  context('with minted tokens and deployed contracts', function () {
    beforeEach(async function () {
      /* get signers */
      [signer, user, ...others] = await ethers.getSigners();
      /* deploy controller contract */
      let Controller = await ethers.getContractFactory("Controller");
      controller = await Controller.deploy();
      await controller.deployed();
      /* deploy token logic contract */
      OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
      oxERC721Upgradeable = await OxERC721Upgradeable.deploy();
      await oxERC721Upgradeable.deployed();
      /* deploy token proxy contract */
      let Committable = await ethers.getContractFactory("Committable");
      let ABI = ["function initialize(string,string,address)"];
      let iface = new ethers.utils.Interface(ABI);
      let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
      committable = await Committable.deploy(oxERC721Upgradeable.address, controller.address, calldata);
      await committable.deployed();
      /* attach token proxy contract with logic contract abi */
      committable = await OxERC721Upgradeable.attach(committable.address);
      /* deploy router contract */
      let Router = await ethers.getContractFactory("Router");
      router = await Router.deploy(controller.address);
      await router.deployed();
      /* set router address in controller contract */
      tx = await controller.setRouter(router.address);
      await tx.wait();
      /* sign some tokenId */
      let abiCoder = new ethers.utils.AbiCoder;
      let signature_0 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_0])));
      let signature_1 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_1])));
      let signature_2 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_2])));
      let signature_3 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_3])));
      /* mint tokenId_0, tokenId_1, tokenId_2 to signer, tokenId_3 to user */
      await committable.mint(signer.address, tokenId_0, signature_0);
      await committable.mint(signer.address, tokenId_1, signature_1);
      await committable.mint(signer.address, tokenId_2, signature_2);
      await committable.mint(user.address, tokenId_3, signature_3);

    })

    context('with legitimate batch request', function () {
      it('return batch tokenIds sorted by all tokens', async function () {
        let tokenIds = [tokenId_0, tokenId_1, tokenId_2, tokenId_3];
        let tokenIds_bn = tokenIds.map((tokenId) => { return ethers.BigNumber.from(tokenId) });
        expect((await router.tokenByIndexBatch(committable.address, [0, 1, 2, 3])))
          .deep.to.equal(tokenIds_bn)
      })
      it('return batch tokenIds sorted by owner', async function () {
        let tokenIds_signer = [tokenId_0, tokenId_1, tokenId_2];
        let tokenIds_user = [tokenId_3];

        let tokenIds_signer_bn = tokenIds_signer.map((tokenIds_signer) => { return ethers.BigNumber.from(tokenIds_signer) });
        let tokenIds_user_bn = tokenIds_user.map((tokenIds_user) => { return ethers.BigNumber.from(tokenIds_user) });

        expect((await router.tokenOfOwnerByIndexBatch(committable.address, signer.address, [0, 1, 2])))
          .deep.to.equal(tokenIds_signer_bn)
        expect((await router.tokenOfOwnerByIndexBatch(committable.address, user.address, [0])))
          .deep.to.equal(tokenIds_user_bn)
      })
    })

    // context('[event test] mintAndTransfer function', function () {
    //   it('should emit desired event', async function () {
    //     let signature_4 = await signer.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_4)));

    //     let tx = await router['transferERC721(address,address,address,uint256,(string,bytes20[]),bytes)'](committable.address, signer.address, user.address, tokenId_4, commitInfo_4, signature_4);
    //     expect(tx).to.emit(committable, "Transfer")
    //       .withArgs(ZERO_ADDRESS, signer.address, tokenId_4);
    //     expect(tx).to.emit(committable, "Transfer")
    //       .withArgs(signer.address, user.address, tokenId_4);
    //   })
    // })
    // context('with legitimate lazy_mint', function () {
    //   beforeEach('lazy mint from signer to user', async function () {
    //     let signature_4 = await signer.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_4)));
    //     let tx = await router['transferERC721(address,address,address,uint256,(string,bytes20[]),bytes)'](committable.address, signer.address, user.address, tokenId_4, commitInfo_4, signature_4);
    //     await tx.wait();
    //   })
    //   it('should return correct owner', async function () {
    //     expect(await committable.ownerOf(tokenId_4)).to.equal(user.address);
    //   })
    // })

    // context('with legitimate mint and transfer', function () {
    //   beforeEach('mintAndTransfer from signer to user', async function () {
    //     let signature_4 = await signer.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_4)));
    //     let tx = await committable.mint(signer.address, tokenId_4, commitInfo_4, signature_4);
    //     await tx.wait();
    //     tx = await router['transferERC721(address,address,address,uint256)'](committable.address, signer.address, user.address, tokenId_4);
    //     await tx.wait();
    //   })
    //   it('should return correct owner', async function () {
    //     expect(await committable.ownerOf(tokenId_4)).to.equal(user.address);
    //   })
    // })

    context('with router disabled', function () {
      // it('should revert if commitInfo is signed by unauthorized address', async function () {
      //   let signature_4 = await user.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_4)));
      //   try {
      //     let tx = await router['transferERC721(address,address,address,uint256,(string,bytes20[]),bytes)'](committable.address, signer.address, user.address, tokenId_4, commitInfo_4, signature_4);
      //     await tx.wait();
      //     throw null;
      //   } catch (err) {
      //     expect(await err.message).to.include("commitInfo signature validation failed");
      //   }
      // })
      it('should revert if user has disabled router', async function () {
        let abiCoder = new ethers.utils.AbiCoder;
        let signature_4 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_4])));
        try {
          let tx = await router.connect(user).disable(true);
          await tx.wait();
          tx = await router.transferFrom(committable.address, user.address, signer.address, tokenId_4);
          await tx.wait();
          throw null;
        } catch (err) {
          expect(await err.message).to.include("invalid sender: must be registered address");
        }
      })
    })



  })










})




