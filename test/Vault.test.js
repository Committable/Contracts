const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const { Controller,Exchange, Vault } = require("../utils/deployer.js")





describe('Vault', function () {
    context('with deployed contracts', function () {
        beforeEach('deploy contracs', async function () {
            /* get signers */
            [owner, receiver, ...others] = await ethers.getSigners();
            provider =  waffle.provider;


            controller = await new Controller().deploy(owner.address)
            exchange = await new Exchange().deploy(controller)
            vault = await new Vault().deploy(controller, exchange)

            value = ethers.utils.parseEther("1")
            sendValue = ethers.utils.parseEther("0.2")
            let tx = {
                to: vaultProxy.address,
                // Convert currency unit from ether to wei
                // value: ethers.utils.parseEther("1")
                value: value

            }
             await owner.sendTransaction(tx)
            // await signedTx.wait()
        })

        context("owner should be able to use", function () {
            it('should have correct ether balance', async function () {
                expect(await provider.getBalance(vaultProxy.address)).to.equal(value)
            })
            it('should send ether correctly', async function () {
                let originalBalance = await receiver.getBalance()
                let tx = await vaultProxy.sendEther(receiver.address, sendValue)
                await tx.wait()
                let afterBalance = await receiver.getBalance()

                expect(await afterBalance.sub(originalBalance)).to.equal(sendValue)
            })




        })
    })

})