const { expect } = require("chai");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const { projects, commits, tokenIds } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3 } = tokenIds;
const { project_0, project_1 } = projects;
const { commit_0, commit_1, commit_2, commit_3 } = commits;
const { erc721_domain, mint_types } = require('./utils.js');





describe('Committable', function () {
    context('with deployed contracts', function () {
        beforeEach('deploy contracs', async function () {
            /* get signers */
            [signer, user, ...others] = await ethers.getSigners();
            /* deploy controller contract */
            Controller = await ethers.getContractFactory("Controller");
            controller = await Controller.deploy(signer.address);
            await controller.deployed();
            /* deploy token logic contract */
            ERC721Committable = await ethers.getContractFactory("ERC721Committable");
            erc721Committable = await ERC721Committable.deploy();
            await erc721Committable.deployed();
            await controller.deployed();
            /* deploy token proxy contract */
            let CommittableProxy = await ethers.getContractFactory("CommittableProxy");
            let ABI = ["function initialize(string,string,address)"];
            let iface = new ethers.utils.Interface(ABI);
            let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
            tokenProxy = await CommittableProxy.deploy(erc721Committable.address, controller.address, calldata);
            await tokenProxy.deployed();


            /* attach token proxy contract with logic contract abi */
            tokenProxy = await ERC721Committable.attach(tokenProxy.address);
            /* caculate erc721_domain seperator and type */
            erc721_domain.verifyingContract = tokenProxy.address
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

            signature_0 = await signer._signTypedData(erc721_domain, mint_types, mint_0);
            signature_1 = await signer._signTypedData(erc721_domain, mint_types, mint_1);
            signature_2 = await signer._signTypedData(erc721_domain, mint_types, mint_2);
            signature_3 = await signer._signTypedData(erc721_domain, mint_types, mint_3);
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
                        signature_0 = await signer._signTypedData(erc721_domain, mint_types, mint_0);

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

    })





})