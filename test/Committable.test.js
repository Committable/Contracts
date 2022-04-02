const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;
const { projects, commits, tokenIds } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3 } = tokenIds;
const { project_0, project_1 } = projects;
const { commit_0, commit_1, commit_2, commit_3 } = commits;
const { hashMint } = require('./utils.js');

describe('Committable', function () {
    context('with deployed contracts', function () {
        beforeEach('deploy contracs', async function () {
            /* get signers */
            [signer, user, ...others] = await ethers.getSigners();
            /* deploy controller contract */
            Controller = await ethers.getContractFactory("Controller");
            controller = await Controller.deploy();
            await controller.deployed();
            /* deploy token logic contract */
            CommittableV1 = await ethers.getContractFactory("CommittableV1");
            committableV1 = await CommittableV1.deploy();
            await committableV1.deployed();
            await controller.deployed();
            /* deploy token proxy contract */
            let Committable = await ethers.getContractFactory("Committable");
            let ABI = ["function initialize(string,string,address)"];
            let iface = new ethers.utils.Interface(ABI);
            let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
            committable = await Committable.deploy(committableV1.address, controller.address, calldata);
            await committable.deployed();
            /* attach token proxy contract with logic contract abi */
            committable = await CommittableV1.attach(committable.address);
        })

        context("[mint] function test", function () {
            context('with legitimate minting signature', function () {
                beforeEach('mint tokens with legitimate signature', async function () {
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
                it("should mint successfully", async function () {
                    expect(await committable.ownerOf(tokenId_0)).to.equal(signer.address)

                })
                it("should have correct totalSupply", async function () {
                    expect(await committable.totalSupply()).to.equal(4)
                })
            })

            context('with malicious minting signature', function () {
                it('should revert if tokenId and signature do not match', async function () {
                    try {
                        let abiCoder = new ethers.utils.AbiCoder;
                        let signature_0 = await signer.signMessage(ethers.utils.arrayify(hashMint(user.address, tokenId_1)));
                        await committable.mint(signer.address, tokenId_1, signature_0);
                        throw null;
                    } catch (err) {
                        expect(err.message).to.include("invalid token signature");
                    }
                })
            })

        })
        context("[mintAndTransfer] function test", function () {
            beforeEach('mint tokens with legitimate signature', async function () {
                /* sign some tokenId */
                let abiCoder = new ethers.utils.AbiCoder;
                let signature_3 = await signer.signMessage(ethers.utils.arrayify(hashMint(user.address, tokenId_3)));
                /* mint tokenId_3 to user */
                await committable.mint(user.address, tokenId_3, signature_3);
            })
            it("should mint and transfer successfully", async function () {
                /* sign some tokenId */
                let abiCoder = new ethers.utils.AbiCoder;
                let signature_0 = await signer.signMessage(ethers.utils.arrayify(hashMint(signer.address, tokenId_0)));
                await committable.mintAndTransfer(signer.address, user.address, tokenId_0, signature_0)
                expect(await committable.ownerOf(tokenId_0)).to.equal(user.address)

            })
        })



    })





})