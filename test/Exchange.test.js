const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;
const { Asset, hashAsset, Order, hashOrder, encodeTransferFrom, encodeTransferFromReplacement, encodeTransferWithPermit, hashPermit, encodeTransferWithPermitReplacement, encodeMintWithSig, encodeMintWithSigReplacement } = require("./utils.js");
const { projects, commits, tokenIds } = require('./tokenId.js');

const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4, tokenId_5 } = tokenIds;
const { shouldWorkWithLegitimateBehavior } = require('./Exchange.legitimate.behavior.js');
const { shouldRevertWithMaliciousBehavior } = require('./Exchange.malicious.behavior.js')

ROYALTY = '1000'; // 10%
const life_span = 60 * 60 * 24 * 7 // one week
FEE = '100' // 1%
PRICE = ethers.utils.parseEther('100').toString();
DEADLINE = 0;


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
      let CommittableV1 = await ethers.getContractFactory("CommittableV1");
      committableV1 = await CommittableV1.deploy();
      await committableV1.deployed();
      /* deploy token proxy contract */
      let Committable = await ethers.getContractFactory("Committable");
      let ABI = ["function initialize(string,string,address)"];
      let iface = new ethers.utils.Interface(ABI);
      let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
      committable = await Committable.deploy(committableV1.address, controller.address, calldata);
      await committable.deployed();
      /* attach token proxy contract with logic contract abi */
      committable = await CommittableV1.attach(committable.address);
      /* deploy router contract */
      let Router = await ethers.getContractFactory("Router");
      router = await Router.deploy(controller.address);
      await router.deployed();
      /* deploy exchange contract */
      let Exchange = await ethers.getContractFactory("Exchange");
      exchange = await Exchange.deploy(controller.address);
      await exchange.deployed();
      // /* set router address & exchange in controller contract */
      // let tx = await controller.grantAuthentication(exchange.address);
      // await tx.wait();
      tx = await controller.setDefaultRouter(router.address);
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
        encodeTransferWithPermit(committable.address, ZERO_ADDRESS, buyer.address, tokenId_0),
        encodeTransferWithPermitReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      nonce = await committable.nonces(seller.address);
      tokenId_0_permit_sig = await seller.signMessage(ethers.utils.arrayify(hashPermit(router.address, tokenId_0, nonce, DEADLINE)));
      sell_order_0 = new Order(
        exchange.address,
        false,
        seller.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        0,
        encodeTransferWithPermit(committable.address, seller.address, ZERO_ADDRESS, tokenId_0, DEADLINE, tokenId_0_permit_sig),
        encodeTransferWithPermitReplacement(false),
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
        encodeTransferWithPermit(committable.address, ZERO_ADDRESS, buyer.address, tokenId_1),
        encodeTransferWithPermitReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      nonce = await committable.nonces(seller.address);
      tokenId_1_permit_sig = await seller.signMessage(ethers.utils.arrayify(hashPermit(router.address, tokenId_1, nonce, DEADLINE)));
      sell_order_1 = new Order(
        exchange.address,
        false,
        seller.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        ROYALTY,
        encodeTransferWithPermit(committable.address, seller.address, ZERO_ADDRESS, tokenId_1, DEADLINE, tokenId_1_permit_sig),
        encodeTransferWithPermitReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
      sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));

      // generate order pairs: pay erc20 to transfer erc721, no royalty
      buy_order_2 = new Order(
        exchange.address,
        true,
        buyer.address,
        ZERO_ADDRESS,
        token.address,
        PRICE,
        royaltyRecipient.address,
        0,
        encodeTransferWithPermit(committable.address, ZERO_ADDRESS, buyer.address, tokenId_2),
        encodeTransferWithPermitReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      nonce = await committable.nonces(seller.address);
      tokenId_2_permit_sig = await seller.signMessage(ethers.utils.arrayify(hashPermit(router.address, tokenId_2, nonce, DEADLINE)));
      sell_order_2 = new Order(
        exchange.address,
        false,
        seller.address,
        ZERO_ADDRESS,
        token.address,
        PRICE,
        royaltyRecipient.address,
        0,
        encodeTransferWithPermit(committable.address, seller.address, ZERO_ADDRESS, tokenId_2, DEADLINE, tokenId_2_permit_sig),
        encodeTransferWithPermitReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )

      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
      sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));

      // generate order pairs: pay erc20 to transfer erc721, have royalty
      buy_order_3 = new Order(
        exchange.address,
        true,
        buyer.address,
        ZERO_ADDRESS,
        token.address,
        PRICE,
        royaltyRecipient.address,
        ROYALTY,
        encodeTransferWithPermit(committable.address, ZERO_ADDRESS, buyer.address, tokenId_3),
        encodeTransferWithPermitReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      nonce = await committable.nonces(seller.address);
      tokenId_3_permit_sig = await seller.signMessage(ethers.utils.arrayify(hashPermit(router.address, tokenId_3, nonce, DEADLINE)));
      sell_order_3 = new Order(
        exchange.address,
        false,
        seller.address,
        ZERO_ADDRESS,
        token.address,
        PRICE,
        royaltyRecipient.address,
        ROYALTY,
        encodeTransferWithPermit(committable.address, seller.address, ZERO_ADDRESS, tokenId_3, DEADLINE, tokenId_3_permit_sig),
        encodeTransferWithPermitReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )

      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_3 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_3)));
      sell_order_sig_3 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_3)));

      // generate order pairs: pay eth to mint erc721, no royalty
      // sign tokenId from server
      let abiCoder = new ethers.utils.AbiCoder();
      let signature_4 = await seller.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_4])));

      buy_order_4 = new Order(
        exchange.address,
        true,
        buyer.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        ZERO_ADDRESS,
        0,
        encodeMintWithSig(committable.address, buyer.address, tokenId_4),
        encodeMintWithSigReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_4 = new Order(
        exchange.address,
        false,
        seller.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        ZERO_ADDRESS,
        0,
        encodeMintWithSig(committable.address, buyer.address, tokenId_4, signature_4),
        encodeMintWithSigReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )

      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_4 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_4)));
      sell_order_sig_4 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_4)));

        // generate order pairs: pay eth to mint erc721, no royalty
      // sign tokenId from server
      let signature_5 = await seller.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_5])));

      buy_order_5 = new Order(
        exchange.address,
        true,
        buyer.address,
        ZERO_ADDRESS,
        token.address,
        PRICE,
        ZERO_ADDRESS,
        0,
        encodeMintWithSig(committable.address, buyer.address, tokenId_5),
        encodeMintWithSigReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_5 = new Order(
        exchange.address,
        false,
        seller.address,
        ZERO_ADDRESS,
        token.address,
        PRICE,
        ZERO_ADDRESS,
        0,
        encodeMintWithSig(committable.address, buyer.address, tokenId_5, signature_5),
        encodeMintWithSigReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )

      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_5 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_5)));
      sell_order_sig_5 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_5)));
    })

    shouldWorkWithLegitimateBehavior();
    // shouldRevertWithMaliciousBehavior();
  })

})