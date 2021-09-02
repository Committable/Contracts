const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.setting.js');
const ether = require("@openzeppelin/test-helpers/src/ether");
const { ZERO_ADDRESS } = constants;




exports.transferWasSuccessful = (tokenId) => {
  console.log(global.x)
  it('transfers the ownership of the given tokenID to the given address', async () => {
    expect(await this.tokenProxy.ownerOf(tokenId)).to.equal(this.recipient.address);
  })
  it('adjust owner balance and recipient balance', async () => {
    expect(await this.tokenProxy.balanceOf(this.owner.address)).to.equal('1');
    expect(await this.tokenProxy.balanceOf(this.recipient.address)).to.equal('1');
  })
  it('adjust owners and recipient tokens by index', async () => {
    expect(await this.tokenProxy.tokenOfOwnerByIndex(this.recipient.address, 0)).to.equal(tokenId);
    expect(await this.tokenProxy.tokenOfOwnerByIndex(this.owner.address, 0)).to.not.equal(tokenId);
  })
  it('clears the approval for the tokenId', async () => {
    expect(await this.tokenProxy.getApproved(tokenId)).to.equal(ZERO_ADDRESS);
  })
}