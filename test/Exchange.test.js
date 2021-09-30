const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;
const { Asset, hashAsset, Order, hashOrder, encodeTransferFrom, encodeTransferFromReplacement } = require("./utils.js");
const { projects, commits, tokenIds } = require('./tokenId.js');

const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4 } = tokenIds;
const { shouldWorkWithLegitimateBehavior } = require('./Exchange.legitimate.behavior.js');
const { shouldRevertWithMaliciousBehavior } = require('./Exchange.malicious.behavior.js')

ROYALTY = '1000'; // 10%
const life_span = 60 * 60 * 24 * 7 // one week
FEE = '100' // 1%
PRICE = ethers.utils.parseEther('100').toString();

describe('Exchange', function () {

  context('with deployed contracts initialized orders and fees', function () {
    beforeEach(async function () {
      /* get signers */
      [seller, buyer, royaltyRecipient, recipient, newRecipient, operator, ...others] = await ethers.getSigners();
      /* deploy controller contract */
      let Controller = await ethers.getContractFactory("Controller");
      controller = await Controller.deploy();
      await controller.deployed();
      /* deploy token logic contract */
      let OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
      oxERC721Upgradeable = await OxERC721Upgradeable.deploy();
      await oxERC721Upgradeable.deployed();
      /* deploy token proxy contract */
      let TokenProxy = await ethers.getContractFactory("TokenProxy");
      let ABI = ["function initialize(string,string,address)"];
      let iface = new ethers.utils.Interface(ABI);
      let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
      tokenProxy = await TokenProxy.deploy(oxERC721Upgradeable.address, controller.address, calldata);
      await tokenProxy.deployed();
      /* attach token proxy contract with logic contract abi */
      tokenProxy = await OxERC721Upgradeable.attach(tokenProxy.address);
      /* deploy router contract */
      let Router = await ethers.getContractFactory("Router");
      router = await Router.deploy(controller.address);
      await router.deployed();
      /* deploy exchange contract */
      let Exchange = await ethers.getContractFactory("Exchange");
      exchange = await Exchange.deploy(controller.address);
      await exchange.deployed();
      /* set router address & exchange in controller contract */
      let tx = await controller.grantAuthentication(exchange.address);
      await tx.wait();
      tx = await controller.setRouter(router.address);
      await tx.wait();
      /* deploy erc20 and approve for test */
      let ERC20 = await ethers.getContractFactory("ERC20Test");
      token = await ERC20.connect(buyer).deploy("Tether", "USDT");
      await token.deployed();
      tx = await token.approve(exchange.address, ethers.utils.parseEther('10000').toString());
      await tx.wait();
      /* set platform fee and change recipient */
      tx = await exchange.changeFee(FEE);
      await tx.wait()
      tx = await exchange.changeRecipient(recipient.address);
      await tx.wait()
      // generate order pairs: pay eth to transfer erc721, no royalty
      buy_order_0 = new Order(
        exchange.address,
        true,
        buyer.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        0,
        router.address,
        encodeTransferFrom(tokenProxy.address, ZERO_ADDRESS, buyer.address, tokenId_0),
        encodeTransferFromReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_0 = new Order(
        exchange.address,
        false,
        seller.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        0,
        router.address,
        encodeTransferFrom(tokenProxy.address, seller.address, ZERO_ADDRESS, tokenId_0),
        encodeTransferFromReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )

      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
      sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
      // generate order pairs: pay eth to transfer erc721: have royalty
      buy_order_1 = new Order(
        exchange.address,
        true,
        buyer.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        ROYALTY,
        router.address,
        encodeTransferFrom(tokenProxy.address, ZERO_ADDRESS, buyer.address, tokenId_1),
        encodeTransferFromReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_1 = new Order(
        exchange.address,
        false,
        seller.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        ROYALTY,
        router.address,
        encodeTransferFrom(tokenProxy.address, seller.address, ZERO_ADDRESS, tokenId_1),
        encodeTransferFromReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
      sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));

    })

    shouldWorkWithLegitimateBehavior();
    // shouldRevertWithMaliciousBehavior();
  })

})