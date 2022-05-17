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
        controller = await Controller.deploy(signer.address);
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
  


    it('shoud recover from hsm', async function () {
        let rawSig =
            [
                '0x3045022100888a5953e8fc30349ca6df9bf359378d04dc5fa93b2b331b187d70a21e4e1bdd0220152e3b6b43e5f31bbaef2e22b3444d42a990282e5bd3fb9d3f031c3151829ea3',
                '0x3045022100b86fa3b5a3540776bc769beabe9462d1110968eb6cdf73e5e5b833c1bb2b9e1b022054af88c709237f5af4f2bf5fa2fab916939b03db6df4ddbc87e1accc323bd528',
                '0x3045022100a70d51cd996f2db872c07b998074afac17e72f5355f0313e05e11591ab99bd5b022070ca7c46630ac489ba5477385ceffc4afa189149260a9f2925c402fb2eefefcd',
                '0x3044022067cd2d4a6c184c8088808f7accd31f11861482bc0f4c74eece098106d5dbbc7a0220171a37fbc6ba08de2897fea98f0dadd478c614b5f1b589eb8968fea7ed00bc06',
                '0x304402202d8f244327b4b66b14fb1233c9846eebcca5dde8e1d86ea21707a7025a9fcf4802206663970365078377bc88371e0b2bf33c83c7e476ac0fa0b5b145f166b2ffef7d',
                '0x304402206e638fbf465cb9faaef0c58d0f6b6045ce04dfaca45c882bc3d67bf79093b26d0220250f2638c2a356b367c191a259ea725c6c6166b862b138d771ea379793700eb5'
            ]
        let data =
            [
                'hello1',
                'hello1',
                'hello1',
                'hello12',
                'hello12345',
                'hello12345',
                'commit1',
                '0x01234566'
            ]

        let signature =
            [
                '0x888a5953e8fc30349ca6df9bf359378d04dc5fa93b2b331b187d70a21e4e1bdd152e3b6b43e5f31bbaef2e22b3444d42a990282e5bd3fb9d3f031c3151829ea31c',
                '0xb86fa3b5a3540776bc769beabe9462d1110968eb6cdf73e5e5b833c1bb2b9e1b54af88c709237f5af4f2bf5fa2fab916939b03db6df4ddbc87e1accc323bd5281b',
                '0xa70d51cd996f2db872c07b998074afac17e72f5355f0313e05e11591ab99bd5b70ca7c46630ac489ba5477385ceffc4afa189149260a9f2925c402fb2eefefcd1c',
                '0x67cd2d4a6c184c8088808f7accd31f11861482bc0f4c74eece098106d5dbbc7a171a37fbc6ba08de2897fea98f0dadd478c614b5f1b589eb8968fea7ed00bc061b',
                '0x2d8f244327b4b66b14fb1233c9846eebcca5dde8e1d86ea21707a7025a9fcf486663970365078377bc88371e0b2bf33c83c7e476ac0fa0b5b145f166b2ffef7d1b',
                '0x6e638fbf465cb9faaef0c58d0f6b6045ce04dfaca45c882bc3d67bf79093b26d250f2638c2a356b367c191a259ea725c6c6166b862b138d771ea379793700eb51b',
                '0x92d0d37d6f8f9634cb8d602be3c6d913c7d653e136a66ceefc59ed7939dddf0233cd71529cb6394c3dbd6e11dfb6ab44723dd6ec61fdcc3af0db39632292eed41b',
                '0x7e53c9252137208b5d59af3b80c3c824de4af17b52248b8062a8293fb2cd2a3a0832efcc2052363b5f877adde44a671f21782cbf46dc238e4c0342db721e12f91b'
      
            ]

        hashed = data.map((data) => {
            return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data))
        })
        // let hashValue = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hello1"))
        // let hashValue = ethers.utils.keccak256('0x00000000000000000000000075de29fd69b17604858078da900484d0ee085c3c00000000000000001b856e5b5d6b6a29afb4c04b8c144cee2878a2941e62597a')

        console.log("message: ", data)
        console.log("digest: ", hashed)
        console.log("signature: ", signature)
        // console.log(await helper.toSignedMessage(hashValue))
        // console.log('\u0019Ethereum Signed Message:\n32')
        // console.log(await helper.toSignedMessage(hashValue))
        console.log("recovering:")
        console.log(await helper.recover(hashed[0], signature[0]))
        console.log(await helper.recover(hashed[1], signature[1]))
        console.log(await helper.recover(hashed[2], signature[2]))
        console.log(await helper.recover(hashed[3], signature[3]))
        console.log(await helper.recover(hashed[4], signature[4]))
        console.log(await helper.recover(hashed[5], signature[5]))
        console.log(await helper.recover(hashed[6], signature[6]))
        console.log(await helper.recover(ethers.utils.keccak256(data[7]), signature[7]))



    })


})
