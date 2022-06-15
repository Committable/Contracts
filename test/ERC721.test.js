const { expect } = require("chai");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const  ZERO_ADDRESS  = "0x0000000000000000000000000000000000000000";
const { tokenIds, projects, commits } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4 } = tokenIds;
const { hashMint } = require('./utils.js');
describe('ERC721', function () {
  context('with minted tokens and initialized values', function () {
    beforeEach(async function () {
      /* get signers */
      [owner, recipient, approved, operator, batchOwner, ...others] = await ethers.getSigners();
      /* deploy controller contract */
      let Controller = await ethers.getContractFactory("Controller");
      controller = await Controller.deploy(owner.address);
      await controller.deployed();
      /* deploy token logic contract */
      ERC721Committable = await ethers.getContractFactory("ERC721Committable");
      erc721Committable = await ERC721Committable.deploy();
      await erc721Committable.deployed();
      /* deploy token proxy contract */
      let CommittableProxy = await ethers.getContractFactory("CommittableProxy");
      let ABI = ["function initialize(string,string,address)"];
      let iface = new ethers.utils.Interface(ABI);
      let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
      tokenProxy = await CommittableProxy.deploy(erc721Committable.address, controller.address, calldata);
      await tokenProxy.deployed();
      /* attach token proxy contract with logic contract abi */
      tokenProxy = await ERC721Committable.attach(tokenProxy.address)
      /* sign some tokenId */
      let abiCoder = new ethers.utils.AbiCoder;
      let signature_0 = await owner.signMessage(ethers.utils.arrayify(hashMint(owner.address, tokenId_0)));
      let signature_1 = await owner.signMessage(ethers.utils.arrayify(hashMint(owner.address, tokenId_1)));
      /* mint tokenId_0, tokenId_1 to owner */
      let tx = await tokenProxy.mint(owner.address, tokenId_0, signature_0);
      await tx.wait();
      tx = await tokenProxy.mint(owner.address, tokenId_1, signature_1);
      await tx.wait();
    })
    context("when initialized", function () {
      it("returns the correct name and symbol", async function () {
        expect(await tokenProxy.name()).to.equal(NAME);
        expect(await tokenProxy.symbol()).to.equal(SYMBOL);
      })
    })
    context('when the given address owns some tokens', function () {
      it("returns the amount of tokens owned by the given address", async function () {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('2');
      })
    })
    context('when the given address does not own any tokens', function () {
      it('returns 0', async function () {
        expect(await tokenProxy.balanceOf(approved.address)).to.equal('0');
      })
    })
    context('when querying the zero address', function () {
      it('throw', async function () {
        try {
          await tokenProxy.balanceOf(ZERO_ADDRESS);
          throw null;
        } catch (err) {
          expect(err.message).to.include('ERC721: balance query for the zero address');
        }
      })
    })

    context('when the given token ID was tracked by this token', function () {
      const tokenId = tokenId_0;
      it('returns the owner of the given token Id', async function () {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(owner.address);
      })
    })
    context('when the given token ID was not tracked by this token', function () {
      const tokenId = tokenId_2;
      it('revert', async function () {
        try {
          await tokenProxy.ownerOf(tokenId);
          throw null;
        } catch (err) {
          expect(err.message).to.include('ERC721: owner query for nonexistent token');
        }
      })
    })

    context('with the given token ID being sent by owner', function () {
      const tokenId = tokenId_0;
      const data = '0x42';
      beforeEach(async function () {
        
        let tx = await tokenProxy.transferFrom(owner.address, recipient.address, tokenId);
        await tx.wait();
      })

      it('transfers the ownership of the given tokenID to the given address', async function () {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(recipient.address);
      })
      it('adjust owner balance and recipient balance', async function () {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('1');
        expect(await tokenProxy.balanceOf(recipient.address)).to.equal('1');
      })
    
      it('clears the approval for the tokenId', async function () {
        expect(await tokenProxy.getApproved(tokenId)).to.equal(ZERO_ADDRESS);
      })
    })

    context('with the given token ID being sent by approved address', function () {
      const tokenId = tokenId_0;
      const data = '0x42';
      beforeEach(async function () {
        let tx = await tokenProxy.approve(approved.address, tokenId);
        await tx.wait();
        tx = await tokenProxy.connect(approved).transferFrom(owner.address, recipient.address, tokenId);
      })
      it('transfers the ownership of the given tokenID to the given address', async function () {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(recipient.address);
      })
      it('adjust owner balance and recipient balance', async function () {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('1');
        expect(await tokenProxy.balanceOf(recipient.address)).to.equal('1');
      })
    
      it('clears the approval for the tokenId', async function () {
        expect(await tokenProxy.getApproved(tokenId)).to.equal(ZERO_ADDRESS);
      })
    })

    context('with the given token ID being sent by operator', function () {
      const tokenId = tokenId_0;
      const data = '0x42';
      beforeEach(async function () {
        let tx = await tokenProxy.setApprovalForAll(operator.address, true);
        await tx.wait();
        tx = await tokenProxy.connect(operator).transferFrom(owner.address, recipient.address, tokenId);
        await tx.wait();
      })
      it('transfers the ownership of the given tokenID to the given address', async function () {
        expect(await tokenProxy.ownerOf(tokenId)).to.equal(recipient.address);
      })
      it('adjust owner balance and recipient balance', async function () {
        expect(await tokenProxy.balanceOf(owner.address)).to.equal('1');
        expect(await tokenProxy.balanceOf(recipient.address)).to.equal('1');
      })
  
      it('clears the approval for the tokenId', async function () {
        expect(await tokenProxy.getApproved(tokenId)).to.equal(ZERO_ADDRESS);
      })
    })
  })


})

