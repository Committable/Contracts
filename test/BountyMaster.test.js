const { expect } = require("chai");
const { ethers } = require("hardhat");

const helpers = require("@nomicfoundation/hardhat-network-helpers");


const { NAME, SYMBOL, SIGNER_ADDRESS } = require('../.config.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const { tokenIds, repoIds } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3 } = tokenIds;
const { repoId_a, repoId_b } = repoIds;


const { Controller, ERC721Committable, BountyMaster } = require("../utils/deployer.js");
const funding = ethers.utils.parseEther("1")

describe.only('BountyMaster', function () {

    context('with deployed contracts', function () {

        beforeEach('deploy contracs', async function () {
            /* get signers */
            [signer, user, another, ...others] = await ethers.getSigners();
            provider = waffle.provider

            controller = await new Controller().deploy()
            tokenProxy = await new ERC721Committable().deploy(NAME, SYMBOL, signer.address, ZERO_ADDRESS, controller)
            bountyMaster = await new BountyMaster().deploy(tokenProxy)
            /* caculate tokenProxy.domain seperator and type */
            // tokenProxy.domain.verifyingContract = tokenProxy.address
            mint_0 = {
                creator: signer.address,
                tokenId: tokenId_0,
                repoId: repoId_a
            }
            mint_1 = {
                creator: signer.address,
                tokenId: tokenId_1,
                repoId: repoId_a
            }
            /* deploy erc20 and approve for test */
            let ERC20 = await ethers.getContractFactory("USDTMock");
            token = await ERC20.connect(signer).deploy("USDTMock", "USDT-M");
            await token.deployed();
            /* sign some tokenId */

            signature_0 = await signer._signTypedData(tokenProxy.domain, tokenProxy.types, mint_0);
            signature_1 = await signer._signTypedData(tokenProxy.domain, tokenProxy.types, mint_1);

        })

        context("create bounty with erc20", function () {
            beforeEach("createBountyWithERC20", async function () {
                await token.approve(bountyMaster.address, 1000)
                await bountyMaster.createBountyWithERC20(0, token.address, 1000, 16989072180)
            })
            it("createBountyWithERC20()", async function () {
                await token.approve(bountyMaster.address, 1000)
                try {
                    await bountyMaster.createBountyWithERC20(0, token.address, 1000, 16989072180)
                    throw null
                } catch (err) {
                    expect(err.message).to.include("Bounty: id already existed")
                }
            })
            it("getBountyById()", async function () {
                let res = await bountyMaster.getBountyById(0)
                expect(res.id).to.equal(0)
                expect(res.owner).to.equal(signer.address)
                expect(res.rewardToken).to.equal(token.address)
                expect(res.amount).to.equal(1000)
                expect(res.deadline).to.equal(16989072180)
                expect(res.status).to.equal(0)

            })
            it("withdraw()", async function () {
                try {
                    await bountyMaster.withdraw(0);
                    throw null
                } catch (err) {
                    expect(err.message).to.include("BountyMaster: invalid time")
                }
                try {
                    await bountyMaster.withdraw(1);
                    throw null
                } catch (err) {
                    expect(err.message).to.include("BountyMaster: invalid caller")
                }
                try {
                    await bountyMaster.connect(user).withdraw(0);
                    throw null
                } catch (err) {
                    expect(err.message).to.include("BountyMaster: invalid caller")
                }
                // mine a new block with timestamp `newTimestamp`
                await helpers.time.increaseTo(16989072181);
                let tx = await bountyMaster.withdraw(0);
                await expect(tx).to.emit(token, 'Transfer')
                    .withArgs(bountyMaster.address, signer.address, 1000);
                let bounty = await bountyMaster.getBountyById(0)

                expect(bounty.status).to.equal(2)
                try {
                    await bountyMaster.withdraw(0);
                    throw null
                } catch (err) {
                    expect(err.message).to.include("BountyMaster: invalid status")
                }
            })
            context("payToAddress", function () {
                beforeEach("payToAddress", async function () {
                    await bountyMaster.acceptAndPayToAddress(0, [user.address, another.address], [50, 50])
                })
                it("getUserBountyByAddress", async function () {
                    let res = await bountyMaster.getUserBountyByAddress(0, user.address)
                    expect(res.rewardToken).to.equal(token.address)
                    expect(res.amount).to.equal(1000 / 2)
                    res = await bountyMaster.getUserBountyByAddress(0, another.address)
                    expect(res.rewardToken).to.equal(token.address)
                    expect(res.amount).to.equal(1000 / 2)

                })
                it("claimUserBountyByAddress", async function () {
                    let tx = await bountyMaster.connect(user).claimUserBountyByAddress(0)
                    await expect(tx).to.emit(token, 'Transfer')
                        .withArgs(bountyMaster.address, user.address, 1000 / 2);
                    let res = await bountyMaster.getUserBountyByAddress(0, user.address)
                    expect(res.amount).to.equal(0)
                    try {
                        await bountyMaster.connect(user).claimUserBountyByAddress(0)
                        throw null
                    } catch (err) {
                        expect(err.message).to.include("BountyMaster: zero balance")
                    }
                    try {
                        await bountyMaster.connect(user).claimUserBountyByAddress(1)
                        throw null
                    } catch (err) {
                        expect(err.message).to.include("BountyMaster: invalid status")
                    }
                })
            })

            context("pay to token", function () {
                beforeEach("payToToken", async function () {
                    await bountyMaster.acceptAndPayToToken(0, [tokenId_0, tokenId_1], [90, 10])
                })
                it("getUserBountyByToken", async function () {
                    let res = await bountyMaster.getUserBountyByToken(0, tokenId_0)
                    expect(res.rewardToken).to.equal(token.address)
                    expect(res.amount).to.equal(900)
                    res = await bountyMaster.getUserBountyByToken(0, tokenId_1)
                    expect(res.rewardToken).to.equal(token.address)
                    expect(res.amount).to.equal(100)

                })
                it("getTotalUserBountyByTokens", async function () {
                    let res = await bountyMaster.getTotalUserBountyByTokens(0, [tokenId_0, tokenId_1])
                    expect(res.rewardToken).to.equal(token.address)
                    expect(res.amount).to.equal(1000)

                })
                it("claimUserBountyByToken", async function () {
                    // wrong signature
                    try {
                        let tx = await bountyMaster.connect(signer).claimUserBountyByToken(0, tokenId_0, repoId_a, signature_1)
                        throw null
                    } catch (err) {
                        expect(err.message).to.include("ERC721Committable:invalid token signature")
                    }
                    // claim and mint
                    let tx = await bountyMaster.connect(signer).claimUserBountyByToken(0, tokenId_0, repoId_a, signature_0)
                    await expect(tx).to.emit(token, 'Transfer')
                        .withArgs(bountyMaster.address, signer.address, 900);
                    await expect(tx).to.emit(tokenProxy, 'Transfer')
                        .withArgs(ZERO_ADDRESS, signer.address, tokenId_0);
                    let res = await bountyMaster.getUserBountyByToken(0, tokenId_0)
                    expect(res.amount).to.equal(0)
                    // mint first, then claim
                    await tokenProxy.mint(signer.address, tokenId_1, repoId_a, signature_1)
                    tx = await bountyMaster.connect(user).claimUserBountyByToken(0, tokenId_1, repoId_a, signature_1)
                    await expect(tx).to.emit(token, 'Transfer')
                        .withArgs(bountyMaster.address, signer.address, 100);
                    res = await bountyMaster.getUserBountyByToken(0, tokenId_1)
                    expect(res.amount).to.equal(0)
                    // invalid operation
                    try {
                        let tx = await bountyMaster.connect(signer).claimUserBountyByToken(0, tokenId_0, repoId_a, signature_0)
                        throw null
                    } catch (err) {
                        expect(err.message).to.include("BountyMaster: zero balance")
                    }

                })
                it("claimUserBountyByToken with batch", async function () {
                    let tx = await bountyMaster.connect(signer).claimUserBountiesByTokens(0, [tokenId_0, tokenId_1], [repoId_a, repoId_a], [signature_0, signature_1])
                    await expect(tx).to.emit(token, 'Transfer')
                        .withArgs(bountyMaster.address, signer.address, 900);
                    await expect(tx).to.emit(token, 'Transfer')
                        .withArgs(bountyMaster.address, signer.address, 100);
                    await expect(tx).to.emit(tokenProxy, 'Transfer')
                        .withArgs(ZERO_ADDRESS, signer.address, tokenId_0);
                    await expect(tx).to.emit(tokenProxy, 'Transfer')
                        .withArgs(ZERO_ADDRESS, signer.address, tokenId_1);
                    let res = await bountyMaster.getTotalUserBountyByTokens(0, [tokenId_0, tokenId_1])
                    expect(res.rewardToken).to.equal(token.address)
                    expect(res.amount).to.equal(0)
                })

            })






        })

        context.only("create bounty with eth", function () {
            beforeEach("createBountyWithEther", async function () {

                await bountyMaster.createBountyWithEther(0, 169890721800, { value: 1000 })
            })
            it("createBountyWithEther()", async function () {
                try {
                    await bountyMaster.createBountyWithEther(0, 169890721800, { value: 1000 })
                    throw null
                } catch (err) {
                    expect(err.message).to.include("Bounty: id already existed")
                }
            })
            it("getBountyById()", async function () {
                let res = await bountyMaster.getBountyById(0)
                expect(res.id).to.equal(0)
                expect(res.owner).to.equal(signer.address)
                expect(res.rewardToken).to.equal(ZERO_ADDRESS)
                expect(res.amount).to.equal(1000)
                expect(res.deadline).to.equal(169890721800)
                expect(res.status).to.equal(0)

            })
            it("withdraw()", async function () {

                try {
                    await bountyMaster.withdraw(0);
                    throw null
                } catch (err) {
                    expect(err.message).to.include("BountyMaster: invalid time")
                }
                try {
                    await bountyMaster.withdraw(1);
                    throw null
                } catch (err) {
                    expect(err.message).to.include("BountyMaster: invalid caller")
                }
                try {
                    await bountyMaster.connect(user).withdraw(0);
                    throw null
                } catch (err) {
                    expect(err.message).to.include("BountyMaster: invalid caller")
                }
                // mine a new block with timestamp `newTimestamp`
                await helpers.time.increaseTo(169890721801);
                let tx = await bountyMaster.withdraw(0);
                // await expect(tx).to.changeEtherBalance([bountyMaster.address, signer.address], [-1000, 1000])
                await expect(tx).to.changeEtherBalance(signer, 1000)
                // await expect(tx).to.changeEtherBalance(signer.address, "1000")

                let bounty = await bountyMaster.getBountyById(0)

                expect(bounty.status).to.equal(2)
                try {
                    await bountyMaster.withdraw(0);
                    throw null
                } catch (err) {
                    expect(err.message).to.include("BountyMaster: invalid status")
                }
            })
            context("payToAddress", function () {
                beforeEach("payToAddress", async function () {
                    await bountyMaster.acceptAndPayToAddress(0, [user.address, another.address], [50, 50])
                })
                it("getUserBountyByAddress", async function () {
                    let res = await bountyMaster.getUserBountyByAddress(0, user.address)
                    expect(res.rewardToken).to.equal(ZERO_ADDRESS)
                    expect(res.amount).to.equal(1000 / 2)
                    res = await bountyMaster.getUserBountyByAddress(0, another.address)
                    expect(res.rewardToken).to.equal(ZERO_ADDRESS)
                    expect(res.amount).to.equal(1000 / 2)

                })
                it("claimUserBountyByAddress", async function () {
                    let tx = await bountyMaster.connect(user).claimUserBountyByAddress(0)

                    // await expect(tx).to.changeEtherBalance([bountyMaster.address, signer.address], [-500, 500])
                    await expect(tx).to.changeEtherBalance(user,500)

                    let res = await bountyMaster.getUserBountyByAddress(0, user.address)
                    expect(res.amount).to.equal(0)
                    try {
                        await bountyMaster.connect(user).claimUserBountyByAddress(0)
                        throw null
                    } catch (err) {
                        expect(err.message).to.include("BountyMaster: zero balance")
                    }
                    try {
                        await bountyMaster.connect(user).claimUserBountyByAddress(1)
                        throw null
                    } catch (err) {
                        expect(err.message).to.include("BountyMaster: invalid status")
                    }
                })
            })

            context("pay to token", function () {
                beforeEach("payToToken", async function () {
                    await bountyMaster.acceptAndPayToToken(0, [tokenId_0, tokenId_1], [90, 10])
                })
                it("getUserBountyByToken", async function () {
                    let res = await bountyMaster.getUserBountyByToken(0, tokenId_0)
                    expect(res.rewardToken).to.equal(ZERO_ADDRESS)
                    expect(res.amount).to.equal(900)
                    res = await bountyMaster.getUserBountyByToken(0, tokenId_1)
                    expect(res.rewardToken).to.equal(ZERO_ADDRESS)
                    expect(res.amount).to.equal(100)

                })
                it("getTotalUserBountyByTokens", async function () {
                    let res = await bountyMaster.getTotalUserBountyByTokens(0, [tokenId_0, tokenId_1])
                    expect(res.rewardToken).to.equal(ZERO_ADDRESS)
                    expect(res.amount).to.equal(1000)

                })
                it("claimUserBountyByToken", async function () {
                    // wrong signature
                    try {
                        let tx = await bountyMaster.connect(signer).claimUserBountyByToken(0, tokenId_0, repoId_a, signature_1)
                        throw null
                    } catch (err) {
                        expect(err.message).to.include("ERC721Committable:invalid token signature")
                    }
                    // claim and mint
                    let tx = await bountyMaster.connect(signer).claimUserBountyByToken(0, tokenId_0, repoId_a, signature_0)
                    // await expect(tx).to.changeEtherBalance([bountyMaster.address, signer.address], [-900, 900])
                    await expect(tx).to.changeEtherBalance(signer, 900)

                    await expect(tx).to.emit(tokenProxy, 'Transfer')
                        .withArgs(ZERO_ADDRESS, signer.address, tokenId_0);
                    let res = await bountyMaster.getUserBountyByToken(0, tokenId_0)
                    expect(res.amount).to.equal(0)
                    // mint first, then claim
                    await tokenProxy.mint(signer.address, tokenId_1, repoId_a, signature_1)
                    tx = await bountyMaster.connect(user).claimUserBountyByToken(0, tokenId_1, repoId_a, signature_1)

                    // await expect(tx).to.changeEtherBalance([bountyMaster.address, signer.address], [-100, 100])
                    await expect(tx).to.changeEtherBalance(signer, 100)

                    res = await bountyMaster.getUserBountyByToken(0, tokenId_1)
                    expect(res.amount).to.equal(0)
                    // invalid operation
                    try {
                        let tx = await bountyMaster.connect(signer).claimUserBountyByToken(0, tokenId_0, repoId_a, signature_0)
                        throw null
                    } catch (err) {
                        expect(err.message).to.include("BountyMaster: zero balance")
                    }

                })
                it("claimUserBountyByToken with batch", async function () {
                    let tx = await bountyMaster.connect(signer).claimUserBountiesByTokens(0, [tokenId_0, tokenId_1], [repoId_a, repoId_a], [signature_0, signature_1])

                    // await expect(tx).to.changeEtherBalance([bountyMaster.address, signer.address], [-1000, 1000])
                    await expect(tx).to.changeEtherBalance(signer, 1000)

                    await expect(tx).to.emit(tokenProxy, 'Transfer')
                        .withArgs(ZERO_ADDRESS, signer.address, tokenId_0);
                    await expect(tx).to.emit(tokenProxy, 'Transfer')
                        .withArgs(ZERO_ADDRESS, signer.address, tokenId_1);
                    let res = await bountyMaster.getTotalUserBountyByTokens(0, [tokenId_0, tokenId_1])
                    expect(res.rewardToken).to.equal(ZERO_ADDRESS)
                    expect(res.amount).to.equal(0)
                })

            })






        })







    })



})