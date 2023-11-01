const { expect } = require("chai");
const { ethers } = require("hardhat");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const { NAME, SYMBOL, SIGNER_ADDRESS } = require('../.config.js');

const { DEVNETBadge } = require("../utils/deployer.js")

describe('DEVNETBadge', function () {

    context('with deployed contracts', function () {

        beforeEach('deploy contracts', async function () {

            /* get signers */
            [admin, user, ...others] = await ethers.getSigners();
            /* deploy contracts */
            committableBadge = await new DEVNETBadge().deploy("DEVNETBadge", "Badge")

        })
        context("mint() function", function () {
            it("should mint successfully", async function () {
                await committableBadge.mint(admin.address, 1)
                expect(await committableBadge.ownerOf(1)).to.equal(admin.address);
            })
            it("non-admin should not mint successfully", async function () {
                try {
                    await committableBadge.connect(user).mint(admin.address, 1)
                    throw null
                }catch(err){
                    expect(err.message).to.include("Ownable: caller is not the owner")
                }
            })
        })
        context("changeBaseURi() function", function () {
            it("should mint successfully", async function () {
                await committableBadge.mint(admin.address, 1)
                await committableBadge.changeBaseURI("http://google.com/")
                expect(await committableBadge.tokenURI(1)).to.equal("http://google.com/1");
            })
            it("non-admin should not mint successfully", async function () {
                try {
                    await committableBadge.connect(user).changeBaseURI("http://google.com")
                    throw null
                }catch(err){
                    expect(err.message).to.include("Ownable: caller is not the owner")
                }
            })
        })
    })


})


