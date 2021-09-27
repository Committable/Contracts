const { expect } = require("chai");
const { ethers } = require("hardhat");
const { encodeTransferFromReplacement, encodeTransferFrom } = require('./utils.js');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ERC721_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const token_id = 1
describe('replacement', function () {

    beforeEach('deploy replacement', async function () {
        [signer, another, ...others] = await ethers.getSigners();
        const Replacement = await ethers.getContractFactory('Replacement');
        replacement = await Replacement.deploy();
        await replacement.deployed();
    })
    it('should allow basic replacement', async function () {
        expect(await replacement.replace(
            '0x23b872dd000000000000000000000000431e44389a003f0ec6e83b3578db5075a44ac5230000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006f',
            '0x23b872dd0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065abe5f01cf94d37762780695cf19b151ed5809000000000000000000000000000000000000000000000000000000000000006f',
            '0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000'
        )).to.equal(
            '0x23b872dd000000000000000000000000431e44389a003f0ec6e83b3578db5075a44ac523000000000000000000000000065abe5f01cf94d37762780695cf19b151ed5809000000000000000000000000000000000000000000000000000000000000006f'
        )
    })
    it('should allow basic replacement B', async function () {
        expect(await replacement.replace(
            '0x12340000',
            '0x00005678',
            '0x0000ffff'
        )).to.equal(
            '0x12345678'
        )
    })
    it('should have equal output after replacement', async function () {
        // signer transfer ERC721 to another
        let buyData = encodeTransferFrom(ERC721_ADDRESS, ZERO_ADDRESS, another.address, token_id)
        let sellData = encodeTransferFrom(ERC721_ADDRESS, signer.address, ZERO_ADDRESS, token_id)

        let buyReplacement = encodeTransferFromReplacement(true);
        let sellReplacement = encodeTransferFromReplacement(false);
        console.log(buyData);
        console.log(sellData);
        // console.log(buyReplacement)
        let buyDataAfter = await replacement.replace(buyData, sellData, buyReplacement);
        let sellDataAfter = await replacement.replace(sellData, buyData, sellReplacement)
        console.log(buyDataAfter);
        console.log(sellDataAfter);
        expect(buyDataAfter).to.equal(sellDataAfter);

    })

})
