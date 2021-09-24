const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;
const {  Asset, hashAsset, Order, hashOrder } = require("./utils.js");
const { tokenIds, commitInfo } = require('./commitInfo.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4 } = tokenIds;
const { commitInfo_0, commitInfo_1, commitInfo_2, commitInfo_3, commitInfo_4 } = commitInfo;
const { shouldWorkWithLegitimateBehavior } = require('./Exchange.legitimate.behavior.js');
const { shouldRevertWithMaliciousBehavior } = require('./Exchange.malicious.behavior.js')

const ETH_CLASS = '0xaaaebeba';
const ERC20_CLASS = '0x8ae85d84';
const ERC721_CLASS = '0x73ad2146';
const ROYALTY = 1000; // 10%
const life_span = 60 * 60 * 24 * 7 // one week
const FEE = 2000 // 20%
describe('Exchange', function () {

  context('with deployed contracts initialized orders and fees', function () {
    beforeEach(async function () {
      // get signer
      [seller, buyer, creator, recipient, newRecipient, operator, ...others] = await ethers.getSigners();
      // deploy contracts here
      let Controller = await ethers.getContractFactory("Controller");
      controller = await Controller.deploy();
      await controller.deployed();

      let OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
      oxERC721Upgradeable = await OxERC721Upgradeable.deploy();
      await oxERC721Upgradeable.deployed();

      
      let TokenProxy = await ethers.getContractFactory("TokenProxy");
      let ABI = ["function initialize(string,string,address)"];
      let iface = new ethers.utils.Interface(ABI);
      let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
      tokenProxy = await TokenProxy.deploy(oxERC721Upgradeable.address, controller.address, calldata);
      await tokenProxy.deployed();
      tokenProxy = await OxERC721Upgradeable.attach(tokenProxy.address);

      let Router = await ethers.getContractFactory("Router");
      router = await Router.deploy(controller.address);
      await router.deployed();

      let Exchange = await ethers.getContractFactory("Exchange");
      exchange = await Exchange.deploy(controller.address);
      await exchange.deployed();

      let tx = await controller.grantAuthentication(exchange.address);
      await tx.wait();
      tx = await controller.setRouter(router.address);
      await tx.wait();

      // deploy erc20 and approve for test
      let ERC20 = await ethers.getContractFactory("ERC20Test");
      token = await ERC20.connect(buyer).deploy("Tether", "USDT");
      await token.deployed();
      tx = await token.approve(exchange.address, ethers.utils.parseEther('10000').toString());
      await tx.wait();

      // set platform fee and change recipient
      tx = await exchange.changeFee(FEE);
      await tx.wait()
      tx = await exchange.changeRecipient(recipient.address);
      await tx.wait()

      price = ethers.utils.parseEther('100').toString()
      // generate lazy-mint orders
      buy_order_0 = new Order(
        exchange.address,
        true,
        false,
        buyer.address,
        new Asset(ETH_CLASS, ZERO_ADDRESS, price),
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_0),
        ROYALTY,
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      sell_order_0 = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        new Asset(ETH_CLASS, ZERO_ADDRESS, price),
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_0),
        ROYALTY,
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
      sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
      // non auction type using erc20
      buy_order_1 = new Order(
        exchange.address,
        true,
        false,
        buyer.address,
        new Asset(ERC20_CLASS, token.address, price),
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_1),
        ROYALTY,
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      sell_order_1 = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        new Asset(ERC20_CLASS, token.address, price),
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_1),
        ROYALTY,
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
      sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));

      // auction type using erc20
      buy_order_2 = new Order(
        exchange.address,
        true,
        true,
        buyer.address,
        new Asset(ERC20_CLASS, token.address, price),
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_2),
        ROYALTY,
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      sell_order_2 = new Order(
        exchange.address,
        false,
        true,
        seller.address,
        new Asset(ERC20_CLASS, token.address, price),
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_2),
        ROYALTY,
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
      sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));

      // non-auction type using ether: seller purchases nft from creator 
      buy_order_3 = new Order(
        exchange.address,
        true,
        false,
        seller.address,
        new Asset(ETH_CLASS, ZERO_ADDRESS, price),
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_3),
        ROYALTY,
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      sell_order_3 = new Order(
        exchange.address,
        false,
        false,
        creator.address,
        new Asset(ETH_CLASS, ZERO_ADDRESS, price),
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_3),
        ROYALTY,
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      buy_order_sig_3 = await seller.signMessage(ethers.utils.arrayify(hashOrder(buy_order_3)));
      sell_order_sig_3 = await creator.signMessage(ethers.utils.arrayify(hashOrder(sell_order_3)));
    })
    context('with generated orders', function () {

      context("check orders hash and signature", function () {
        it('buy_order on-chain and off-chain hash match', async function () {
          expect(await exchange.getOrderHash(buy_order_0)).to.equal(hashOrder(buy_order_0));
        })
        it('sell_order on-chain and off-chain hash match', async function () {
          expect(await exchange.getOrderHash(sell_order_0)).to.equal(hashOrder(sell_order_0));
        })
        it('buy_order signature pass verification', async function () {
          expect(await exchange.getRecover(buy_order_0, buy_order_sig_0)).to.equal(buyer.address);
        })
        it('sell_order signature pass verification', async function () {
          expect(await exchange.getRecover(sell_order_0, sell_order_sig_0)).to.equal(seller.address);
        })
        it('both orders were flagged as valid', async function () {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_0))).to.equal(true);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_0))).to.equal(true);
        })
        it('both orders were flagged as valid via batch request', async function () {
          expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_0), hashOrder(sell_order_0)])).
            to.deep.equal([true, true]);
        })
      })
    })
    shouldWorkWithLegitimateBehavior();
    shouldRevertWithMaliciousBehavior();
  })

})