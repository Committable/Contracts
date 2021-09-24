const { expect } = require("chai");
const { ethers } = require("hardhat");



describe('replacement', function () {

    beforeEach('deploy replacement', async function() {

        const ArrayUtils = await ethers.getContractFactory('ArrayUtils');
        arrayUtils = await ArrayUtils.deploy();
        await arrayUtils.deployed();
    })
    it('should allow basic replacement', async function(){
        expect(await arrayUtils.guardedArrayReplace(
            '0x23b872dd000000000000000000000000431e44389a003f0ec6e83b3578db5075a44ac5230000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006f',
            '0x23b872dd0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065abe5f01cf94d37762780695cf19b151ed5809000000000000000000000000000000000000000000000000000000000000006f',
            '0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000'
        )).to.equal(
            '0x23b872dd000000000000000000000000431e44389a003f0ec6e83b3578db5075a44ac523000000000000000000000000065abe5f01cf94d37762780695cf19b151ed5809000000000000000000000000000000000000000000000000000000000000006f'
        )
    })
    it('should allow basic replacement B', async function(){
        expect(await arrayUtils.guardedArrayReplace(
            '0x12340000',
            '0x00005678',
            '0x0000ffff'
        )).to.equal(
            '0x12345678'
        )
    })

})
