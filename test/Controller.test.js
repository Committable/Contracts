const { expect } = require("chai");
const { ethers } = require("hardhat");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const { NAME, SYMBOL, SIGNER_ADDRESS } = require('../.config.js');

const { Controller, ERC721Committable } = require("../utils/deployer.js")

describe('Controller', function () {

    context('with deployed contracts', function () {

        beforeEach('deploy contracts', async function () {

            /* get signers */
            [signer, user, ...others] = await ethers.getSigners();
            /* deploy contracts */
            controller = await new Controller().deploy()
            tokenProxy = await new ERC721Committable().deploy(NAME, SYMBOL, signer.address, ZERO_ADDRESS, controller)

        })
        context("should get admin", function () {
            it("should return correct admin", async function () {
                expect(await controller.getProxyAdmin(tokenProxy.address)).to.equal(controller.address);
            })
        })


    })


})


