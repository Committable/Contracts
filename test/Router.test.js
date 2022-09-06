const { expect } = require("chai");
const { ethers } = require("hardhat");
const { NAME, SYMBOL, SIGNER_ADDRESS } = require('../.config.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const { tokenIds } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3 } = tokenIds;

const { Controller, ERC721Committable, Router } = require("../utils/deployer.js");
const { intToBuffer } = require("ethereumjs-util");
const funding = ethers.utils.parseEther("1")

describe('Committable', function () {
    context('with deployed contracts', function () {
        beforeEach('deploy contracs', async function () {
            /* get signers */
            [signer, user, ...others] = await ethers.getSigners();
            /* deploy contracts */
            controller = await new Controller().deploy(signer.address)
            tokenProxy = await new ERC721Committable().deploy(NAME, SYMBOL, controller)
            // provider =  waffle.provider;
            router = await new Router().deploy(tokenProxy)
            /* caculate tokenProxy.domain seperator and type */
            // tokenProxy.domain.verifyingContract = tokenProxy.address
            mint_0 = {
                creator: signer.address,
                tokenId: tokenId_0,
            }
            mint_1 = {
                creator: signer.address,
                tokenId: tokenId_1,
            }
            mint_2 = {
                creator: signer.address,
                tokenId: tokenId_2,
            }
            mint_3 = {
                creator: user.address,
                tokenId: tokenId_3,
            }

            /* sign some tokenId */

            signature_0 = await signer._signTypedData(tokenProxy.domain, tokenProxy.types, mint_0);
            signature_1 = await signer._signTypedData(tokenProxy.domain, tokenProxy.types, mint_1);
            signature_2 = await signer._signTypedData(tokenProxy.domain, tokenProxy.types, mint_2);
            signature_3 = await signer._signTypedData(tokenProxy.domain, tokenProxy.types, mint_3);

            /* create payroll */
            payroll = [
                {
                    tokenId: tokenId_0,
                    reward: ethers.utils.parseEther("1")
                },
                {
                    tokenId: tokenId_1,
                    reward: ethers.utils.parseEther("2")
                },
                {
                    tokenId: tokenId_2,
                    reward: ethers.utils.parseEther("3")
                },
                {
                    tokenId: tokenId_3,
                    reward: ethers.utils.parseEther("4")
                },
            ]
        })
        context.only("with minted token", function () {
            beforeEach("mint tokens", async function () {
                let tx = await tokenProxy.mint(signer.address, tokenId_0, signature_0)
                await tx.wait()
                tx = await tokenProxy.mint(signer.address, tokenId_1, signature_1)
                await tx.wait()
                tx = await tokenProxy.mint(signer.address, tokenId_2, signature_2)
                await tx.wait()
                tx = await tokenProxy.mint(user.address, tokenId_3, signature_3)
                await tx.wait()
            })
            it("batch fund", async function () {
                let tx = await router.batchFund(payroll, { value: ethers.utils.parseEther("10") })
                await tx.wait()
                expect(await tokenProxy.fundsOf(tokenId_0)).to.equal(ethers.utils.parseEther("1"))
                expect(await tokenProxy.fundsOf(tokenId_1)).to.equal(ethers.utils.parseEther("2"))
                expect(await tokenProxy.fundsOf(tokenId_2)).to.equal(ethers.utils.parseEther("3"))
                expect(await tokenProxy.fundsOf(tokenId_3)).to.equal(ethers.utils.parseEther("4"))

            })
        })
        context.only("with 1minted token", function () {
            beforeEach("mint tokens", async function () {
                let tx = await tokenProxy.mint(signer.address, tokenId_0, signature_0)
                await tx.wait()
                // tx = await tokenProxy.mint(signer.address, tokenId_1, signature_1)
                // await tx.wait()
                // tx = await tokenProxy.mint(signer.address, tokenId_2, signature_2)
                // await tx.wait()
                // tx = await tokenProxy.mint(user.address, tokenId_3, signature_3)
                // await tx.wait()
            })
            it("batch fund", async function () {
                let  /* create payroll */
                payroll = [
                    {
                        tokenId: tokenId_0,
                        reward: ethers.utils.parseEther("1")
                    },
                ]
                
                let tx = await router.batchFund(payroll, { value: ethers.utils.parseEther("10") })
                await tx.wait()
                // expect(await tokenProxy.fundsOf(tokenId_0)).to.equal(ethers.utils.parseEther("1"))
                // expect(await tokenProxy.fundsOf(tokenId_1)).to.equal(ethers.utils.parseEther("2"))
                // expect(await tokenProxy.fundsOf(tokenId_2)).to.equal(ethers.utils.parseEther("3"))
                // expect(await tokenProxy.fundsOf(tokenId_3)).to.equal(ethers.utils.parseEther("4"))

            })
        })

    })





})