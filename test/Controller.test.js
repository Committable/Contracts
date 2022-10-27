const { expect } = require("chai");
const { ethers } = require("hardhat");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const { Controller } = require("../utils/deployer.js")

describe('Controller', function () {

    context('with deployed contracts', function () {

        beforeEach('deploy contracts', async function () {

            /* get signers */
            [signer, user, ...others] = await ethers.getSigners();
            /* deploy contracts */
            controller = await new Controller().deploy(signer.address)

        })
        context("setSigner()", function () {
            it("can set signer", async function () {

                let tx = await controller.setSigner(ZERO_ADDRESS)
                await tx.wait()
                expect(await controller.getSigner()).to.equal(ZERO_ADDRESS)
            })
            it("revert when non-owner call", async function () {
                try {
                    let tx = await controller.connect(user).setSigner(ZERO_ADDRESS)
                    await tx.wait()
                    throw null
                } catch (err) {
                    expect(err.message).to.include("Ownable: caller is not the owner")
                }

            })
        })
    })



})


