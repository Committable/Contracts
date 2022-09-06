const { expect } = require("chai");
const { ethers } = require("hardhat");
const { NAME, SYMBOL, SIGNER_ADDRESS } = require('../.config.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const { tokenIds } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3 } = tokenIds;

const { Controller, ERC721Committable } = require("../utils/deployer.js")
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
        })

        context("[mint] function test", function () {
            context('with legitimate minting signature', function () {
                beforeEach('mint tokens with legitimate signature', async function () {
                    /* mint tokenId_0, tokenId_1, tokenId_2 to signer, tokenId_3 to user */
                    await tokenProxy.mint(signer.address, tokenId_0, signature_0);
                    await tokenProxy.mint(signer.address, tokenId_1, signature_1);
                    await tokenProxy.mint(signer.address, tokenId_2, signature_2);
                    await tokenProxy.mint(user.address, tokenId_3, signature_3);
                })
                it("should mint successfully", async function () {
                    expect(await tokenProxy.ownerOf(tokenId_0)).to.equal(signer.address)

                })
                it("should have correct totalSupply", async function () {
                    expect(await tokenProxy.totalSupply()).to.equal(4)
                })

            })

            context('with malicious minting signature', function () {
                it('should revert if tokenId and signature do not match', async function () {
                    try {
                        let abiCoder = new ethers.utils.AbiCoder;
                        signature_0 = await signer._signTypedData(tokenProxy.domain, tokenProxy.types, mint_0);

                        await tokenProxy.mint(signer.address, tokenId_1, signature_0);
                        throw null;
                    } catch (err) {
                        expect(err.message).to.include("invalid token signature");
                    }
                })
            })

        })


        context("ownership test", function () {
            beforeEach('mint tokens with legitimate signature', async function () {
                /* mint tokenId_0, tokenId_1, tokenId_2 to signer, tokenId_3 to user */
                await tokenProxy.mint(signer.address, tokenId_0, signature_0);
                await tokenProxy.mint(signer.address, tokenId_1, signature_1);
                await tokenProxy.mint(signer.address, tokenId_2, signature_2);
                await tokenProxy.mint(user.address, tokenId_3, signature_3);
            })
            it("owner can change baseuri", async function () {
                let tx = await tokenProxy.connect(signer).changeBaseURI("http://www.google.com/")
                let tokenId = ethers.BigNumber.from(tokenId_0)


                expect(await tokenProxy.tokenURI(tokenId_0)).to.equal("http://www.google.com/" + tokenId.toString())


            })
            it("revert when non-owner try to change baseuri", async function () {
                try {
                    let tx = await tokenProxy.connect(user).changeBaseURI("http://www.google.com/")
                    throw null
                } catch (err) {
                    expect(err.message).to.include("Ownable: caller is not the owner")
                }
            })
        })
        context.only("fund()", function () {
            it("should fund minted token successfully and show funds amount", async function () {
                await tokenProxy.mint(signer.address, tokenId_0, signature_0);
                let tx = await tokenProxy.fund(tokenId_0, { value: funding })
                // state change
                expect(await tokenProxy.fundsOf(tokenId_0)).to.equal(funding)
                // value change
                await expect(tx).to.changeEtherBalance(signer, funding.mul("-1"))
                await expect(tx).to.changeEtherBalance(tokenProxy, funding)
                // emit event
                await expect(tx).to.emit(tokenProxy, 'Fund')
                    .withArgs(signer.address, tokenId_0, funding);

            })
            it("should fund unminted token successfully and show funds amount", async function () {
                await tokenProxy.fund(tokenId_1, { value: funding })
                expect(await tokenProxy.fundsOf(tokenId_1)).to.equal(funding)
            })
            it("should reflect correct amount after several funds", async function () {
                await tokenProxy.fund(tokenId_1, { value: funding })
                await tokenProxy.fund(tokenId_1, { value: funding })
                expect(await tokenProxy.fundsOf(tokenId_1)).to.equal(funding.add(funding))
            })

        })

        context("claim()", function () {
            context("with minted token", function () {
                beforeEach('mint tokens with legitimate signature', async function () {
                    /* mint tokenId_0, tokenId_1, tokenId_2 to signer, tokenId_3 to user */
                    let tx = await tokenProxy.mint(signer.address, tokenId_0, signature_0);
                    await tx.wait()
                })
                it("fund and claim", async function () {
                    // fund
                    let tx = await tokenProxy.fund(tokenId_0, { value: funding })
                    await tx.wait()
                    // claim
                    tx = await tokenProxy.claim(tokenId_0)
                    await tx.wait()
                    // state change
                    expect(await tokenProxy.fundsOf(tokenId_0)).equal("0")
                    // value change
                    await expect(tx).to.changeEtherBalance(signer, funding)
                    await expect(tx).to.changeEtherBalance(tokenProxy, funding.mul("-1"))
                    // emit event
                    await expect(tx).to.emit(tokenProxy, 'Claim')
                        .withArgs(signer.address, tokenId_0, funding);
                })
                it("fund several times and claim", async function () {
                    // fund
                    let tx = await tokenProxy.fund(tokenId_0, { value: funding })
                    await tx.wait()
                    tx = await tokenProxy.fund(tokenId_0, { value: funding })
                    await tx.wait()
                    // claim
                    tx = await tokenProxy.claim(tokenId_0)
                    await tx.wait()
                    // state change
                    expect(await tokenProxy.fundsOf(tokenId_0)).equal("0")
                    // value change
                    changeValue = funding.add(funding)
                    await expect(tx).to.changeEtherBalance(signer, changeValue)
                    await expect(tx).to.changeEtherBalance(tokenProxy, changeValue.mul("-1"))
                    // emit event
                    await expect(tx).to.emit(tokenProxy, 'Claim')
                        .withArgs(signer.address, tokenId_0, changeValue);
                })
                it("fund, transfer and claim", async function () {
                    // fund
                    let tx = await tokenProxy.fund(tokenId_0, { value: funding })
                    await tx.wait()
                    // transfer
                    tx = await tokenProxy.transferFrom(signer.address, user.address, tokenId_0)
                    await tx.wait()
                    // claim
                    tx = await tokenProxy.connect(user).claim(tokenId_0)
                    await tx.wait()
                    // state change
                    expect(await tokenProxy.fundsOf(tokenId_0)).equal("0")
                    // value change
                    changeValue = funding
                    await expect(tx).to.changeEtherBalance(user, changeValue)
                    await expect(tx).to.changeEtherBalance(tokenProxy, changeValue.mul("-1"))
                    // emit event
                    await expect(tx).to.emit(tokenProxy, 'Claim')
                        .withArgs(user.address, tokenId_0, changeValue);
                })
                it("fund, claimed by invalid user, transfer and claim", async function () {
                    // fund
                    let tx = await tokenProxy.fund(tokenId_0, { value: funding })
                    await tx.wait()
                    // claim by wrong user
                    try {
                        tx = await tokenProxy.connect(user).claim(tokenId_0)
                        await tx.wait()
                        throw null
                    } catch (err) {
                        expect(err.message).to.include("ERC721Fundable: only token owner can claim")
                        expect(await tokenProxy.fundsOf(tokenId_0)).equal(funding)

                    }
                    // transfer
                    tx = await tokenProxy.transferFrom(signer.address, user.address, tokenId_0)
                    await tx.wait()
                    // claim
                    tx = await tokenProxy.connect(user).claim(tokenId_0)
                    await tx.wait()
                    // state change
                    expect(await tokenProxy.fundsOf(tokenId_0)).equal("0")
                    // value change
                    changeValue = funding
                    await expect(tx).to.changeEtherBalance(user, changeValue)
                    await expect(tx).to.changeEtherBalance(tokenProxy, changeValue.mul("-1"))
                    // emit event
                    await expect(tx).to.emit(tokenProxy, 'Claim')
                        .withArgs(user.address, tokenId_0, changeValue);
                })
                it("fund, claim and claim", async function () {
                    // fund
                    let tx = await tokenProxy.fund(tokenId_0, { value: funding })
                    await tx.wait()
                    // claim
                    tx = await tokenProxy.claim(tokenId_0)
                    await tx.wait()
                    // state change
                    expect(await tokenProxy.fundsOf(tokenId_0)).equal("0")
                    // value change
                    await expect(tx).to.changeEtherBalance(signer, funding)
                    await expect(tx).to.changeEtherBalance(tokenProxy, funding.mul("-1"))
                    // emit event
                    await expect(tx).to.emit(tokenProxy, 'Claim')
                        .withArgs(signer.address, tokenId_0, funding);
                    // claim again
                    try {
                        tx = await tokenProxy.claim(tokenId_0)
                        await tx.wait()
                        throw null
                    } catch (err) {
                        expect(err.message).to.include("ERC721Fundable: zero balance")
                    }
                })
            })
            context("with un-minted token", function () {
                beforeEach("fund", async function () {
                    let tx = await tokenProxy.fund(tokenId_0, { value: funding })
                    await tx.wait()
                })
                it("should fund successfully", async function () {
                    expect(await tokenProxy.fundsOf(tokenId_0)).to.equal(funding)
                })
                it("clain without minting", async function () {
                    try {
                        let tx = await tokenProxy.claim(tokenId_0)
                        await tx.wait()
                        throw null
                    } catch (err) {
                        expect(err.message).to.include("ERC721Fundable: only token owner can claim")
                    }
                })
                it("mint and claim", async function () {
                    // mint
                    let tx = await tokenProxy.mint(signer.address, tokenId_0, signature_0);
                    await tx.wait()
                    // claim
                    tx = await tokenProxy.claim(tokenId_0)
                    await tx.wait()
                    // state change
                    expect(await tokenProxy.fundsOf(tokenId_0)).equal("0")
                    // value change
                    await expect(tx).to.changeEtherBalance(signer, funding)
                    await expect(tx).to.changeEtherBalance(tokenProxy, funding.mul("-1"))
                    // emit event
                    await expect(tx).to.emit(tokenProxy, 'Claim')
                        .withArgs(signer.address, tokenId_0, funding);

                })
            })



        })
    })





})