const { expect } = require("chai");
const { ethers } = require("hardhat");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const { NAME, SYMBOL, SIGNER_ADDRESS } = require('../.config.js');

const { Controller, ERC721Committable, DevIdentity } = require("../utils/deployer.js")

describe('Controller', function () {

    context('with deployed contracts', function () {

        beforeEach('deploy contracts', async function () {

            /* get signers */
            [signer, user, ...others] = await ethers.getSigners();
            /* deploy contracts */
            controller = await new Controller().deploy()
            devIdentity = await new ERC721Committable().deploy(NAME, SYMBOL, signer.address, ZERO_ADDRESS, controller)

        })
        context("should get admin", function () {
            it("should return correct admin and implementation", async function () {
                expect(await controller.getProxyAdmin(devIdentity.address)).to.equal(controller.address);
                expect(await controller.getProxyImplementation(devIdentity.address)).to.equal(devIdentity.implementation);
            })
        })
    })


})


