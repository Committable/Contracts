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

            USDTMock = await ethers.getContractFactory("USDTMock")
            usdt =await USDTMock.deploy("Tether", "USDT")
            await usdt.deployed()

            value = ethers.utils.parseEther("1")
            sendValue = ethers.utils.parseEther("0.2")
            let tx = {
                to: vault.address,
                // Convert currency unit from ether to wei
                // value: ethers.utils.parseEther("1")
                value: value

            }
            await owner.sendTransaction(tx)
            // await signedTx.wait()
            await usdt.transfer(vault.address, value)
        })

        context("owner should be able to use", function () {
            it('should have correct ether balance', async function () {
                expect(await provider.getBalance(vault.address)).to.equal(value)
            })
            it('should send ether correctly', async function () {
                let originalBalance = await receiver.getBalance()
                let tx = await vault.sendEther(receiver.address, sendValue)
                await tx.wait()
                let afterBalance = await receiver.getBalance()

                expect(await afterBalance.sub(originalBalance)).to.equal(sendValue)
            })
            it('should have correct usdt balance', async function () {
                expect(await usdt.balanceOf(vault.address)).to.equal(value)
            })
            it('should send usdt correctly', async function () {
                let tx = await vault.sendERC20(usdt.address, receiver.address, value)
                await tx.wait()
                expect(await usdt.balanceOf(vault.address)).to.equal("0")
                expect(await usdt.balanceOf(receiver.address)).to.equal(value)

            })

        })
        context("non-owner request should be reverted", function () {
            it('should revert when retreiving ethers', async function () {
                
                try {
                    let tx = await vault.connect(receiver).sendEther(receiver.address, sendValue)
                    await tx.wait()
                    throw null
                } catch(err) {
                    expect(err.message).to.include("Ownable: caller is not the owner")
                }
            })
            it('should revert when retreiving erc20', async function () {
                
                try {
                    let tx = await vault.connect(receiver).sendERC20(usdt.address, receiver.address, sendValue)
                    await tx.wait()
                    throw null
                } catch(err) {
                    expect(err.message).to.include("Ownable: caller is not the owner")
                }
            })


        })
    })

})