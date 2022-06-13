const { expect } = require("chai");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const  ZERO_ADDRESS  = "0x0000000000000000000000000000000000000000";

const { hashPermit } = require('./utils.js');
const { tokenIds } = require('./tokenId.js');
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
      CommittableV1 = await ethers.getContractFactory("CommittableV1");
      committableV1 = await CommittableV1.deploy();
      await committableV1.deployed();
      /* deploy token proxy contract */
      let Committable = await ethers.getContractFactory("Committable");
      let ABI = ["function initialize(string,string,address)"];
      let iface = new ethers.utils.Interface(ABI);
      let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
      committable = await Committable.deploy(committableV1.address, controller.address, calldata);
      await committable.deployed();
      /* attach token proxy contract with logic contract abi */
      committable = await CommittableV1.attach(committable.address);
      /* deploy router contract */
      let Router = await ethers.getContractFactory("Router");
      router = await Router.deploy(controller.address);
      await router.deployed();
      /* set router address in controller contract */
      tx = await controller.setDefaultRouter(router.address);
      await tx.wait();
      /* approve user address in controller contract */
      tx = await controller.approveOrCancel(signer.address, true);
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

    

    // context('[transferWithPermit] function test', function () {
    //   it('should successfully transfer tokenId_0 from signer to user', async function () {
    //     /* approve router and make transfer */
    //     nonce = await committable.nonces(signer.address);
    //     let permit_sig = await signer.signMessage(ethers.utils.arrayify(hashPermit(router.address, tokenId_0, nonce, 0)));
    //     expect(await committable.ownerOf(tokenId_0)).to.equal(signer.address);
    //     await router.transferWithPermit(committable.address, signer.address, user.address, tokenId_0, 0, permit_sig);
    //     expect(await committable.ownerOf(tokenId_0)).to.equal(user.address);
    //   })
    //   it('should revert with invalid signature', async function () {
    //     /* approve router and make transfer */
    //     nonce = await committable.nonces(signer.address);
    //     let permit_sig = await user.signMessage(ethers.utils.arrayify(hashPermit(router.address, tokenId_0, nonce, 0)));
    //     expect(await committable.ownerOf(tokenId_0)).to.equal(signer.address);
    //     try {
    //       await router.transferWithPermit(committable.address, signer.address, user.address, tokenId_0, 0, permit_sig);
    //       throw null;
    //     }
    //     catch (err) {
    //       expect(err.message).to.include('invalid permit signature');
    //     }
    //   })
    //   it('should revert with expired signature', async function () {
    //     /* approve router and make transfer */
    //     nonce = await committable.nonces(signer.address);
    //     let permit_sig = await signer.signMessage(ethers.utils.arrayify(hashPermit(router.address, tokenId_0, nonce, 1)));
    //     expect(await committable.ownerOf(tokenId_0)).to.equal(signer.address);
    //     try {
    //       await router.transferWithPermit(committable.address, signer.address, user.address, tokenId_0, 1, permit_sig);
    //       throw null;
    //     }
    //     catch (err) {
    //       expect(err.message).to.include('expired permit signature');
    //     }
    //   })
      
    // })

    // context('[mintWithSig] function test', function () {
    //   it('should successfully mint token through router', async function () {
    //     /* sign some tokenId */
    //     let abiCoder = new ethers.utils.AbiCoder;
    //     let signature_4 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_4])));
    //     await router.mintWithSig(committable.address, user.address, tokenId_4, signature_4);
    //     expect(await committable.ownerOf(tokenId_4), user.address);
    //   })
    //   it('should revert with invalid signature', async function () {
    //     /* sign some tokenId */
    //     let abiCoder = new ethers.utils.AbiCoder;
    //     let signature_4 = await user.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_4])));
    //     try {
    //       await router.mintWithSig(committable.address, user.address, tokenId_4, signature_4);
    //       throw null;
    //     } catch(err) {
    //       expect(err.message).to.include("invalid token signature")
    //     }
    //   })
    // })


    // context('with router disabled', function () {

    //   it('should revert if user has disabled router', async function () {
    //     let abiCoder = new ethers.utils.AbiCoder;
    //     let signature_4 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_4])));
    //     try {
    //       let tx = await router.connect(user).disable(true);
    //       await tx.wait();
    //       tx = await router.transferFrom(committable.address, user.address, signer.address, tokenId_4);
    //       await tx.wait();
    //       throw null;
    //     } catch (err) {
    //       expect(await err.message).to.include("invalid sender: must be registered address");
    //     }
    //   })
    // })



  })
})




