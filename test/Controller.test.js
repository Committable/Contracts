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
       
    })



})


