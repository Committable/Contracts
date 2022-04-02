const { expect } = require("chai");
const { ethers } = require("hardhat");
const { encodeTransfer, encodeTransferReplacement } = require('./utils.js');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ERC721_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const { NAME, SYMBOL } = require('../.config.js');
const { hashMint } = require('./utils.js')
const { tokenIds } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4 } = tokenIds;
describe('helper', function () {

    beforeEach('deploy helper', async function () {
        [signer, another, ...others] = await ethers.getSigners();
        const Helper = await ethers.getContractFactory('Helper');
        helper = await Helper.deploy();
        await helper.deployed();

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
         /* sign some tokenId */
         let abiCoder = new ethers.utils.AbiCoder;
         let signature_0 = await signer.signMessage(ethers.utils.arrayify(hashMint(signer.address, tokenId_0)));
         let signature_1 = await signer.signMessage(ethers.utils.arrayify(hashMint(signer.address, tokenId_1)));
         let signature_2 = await signer.signMessage(ethers.utils.arrayify(hashMint(signer.address, tokenId_2)));
         let signature_3 = await signer.signMessage(ethers.utils.arrayify(hashMint(user.address, tokenId_3)));
         /* mint tokenId_0, tokenId_1, tokenId_2 to signer, tokenId_3 to user */
         await committable.mint(signer.address, tokenId_0, signature_0);
         await committable.mint(signer.address, tokenId_1, signature_1);
         await committable.mint(signer.address, tokenId_2, signature_2);
         await committable.mint(user.address, tokenId_3, signature_3);
    })
    it('should allow basic replacement', async function () {
        expect(await helper.replace(
            '0x23b872dd000000000000000000000000431e44389a003f0ec6e83b3578db5075a44ac5230000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006f',
            '0x23b872dd0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065abe5f01cf94d37762780695cf19b151ed5809000000000000000000000000000000000000000000000000000000000000006f',
            '0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000'
        )).to.equal(
            '0x23b872dd000000000000000000000000431e44389a003f0ec6e83b3578db5075a44ac523000000000000000000000000065abe5f01cf94d37762780695cf19b151ed5809000000000000000000000000000000000000000000000000000000000000006f'
        )
    })
    it('should allow basic replacement B', async function () {
        expect(await helper.replace(
            '0x12340000',
            '0x00005678',
            '0x0fffffff'
        )).to.equal(
            '0x10005678'
        )
    })
    it('should have equal output after replacement', async function () {
        token_id = tokenId_0;
        // signer transfer ERC721 to another
        let buyData = encodeTransfer(ZERO_ADDRESS, another.address, token_id)
        let sellData = encodeTransfer(signer.address, ZERO_ADDRESS, token_id)

        let buyReplacement = encodeTransferReplacement(true);
        let sellReplacement = encodeTransferReplacement(false);

        let buyDataAfter = await helper.replace(buyData, sellData, buyReplacement);
        let sellDataAfter = await helper.replace(sellData, buyData, sellReplacement)

        expect(buyDataAfter).to.equal(sellDataAfter);

    })
   
 
})
