const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;
const { Asset, hashAsset, Order, hashOrder, hashMint, encodeTransferFrom, encodeTransferFromReplacement, encodeTransfer, hashPermit, encodeTransferReplacement, encodeMintAndTransfer, encodeMintAndTransferReplacement } = require("./utils.js");
const { projects, commits, tokenIds } = require('./tokenId.js');

const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4, tokenId_5, tokenId_6, tokenId_7 } = tokenIds;
const { shouldWorkWithLegitimateBehavior } = require('./Exchange.legitimate.behavior.js');
const { shouldRevertWithMaliciousBehavior } = require('./Exchange.malicious.behavior.js')

ROYALTY = '1000'; // 10%
const life_span = 60 * 60 * 24 * 7 // one week
FEE = '1000' // 10%
PRICE = ethers.utils.parseEther('100').toString();
DEADLINE = 0;
UINT256_MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

describe('Exchange', function () {
  context('with deployed contracts initialized orders and fees', function () {
    beforeEach(async function () {

      /* get signers */
      [seller, buyer, royaltyRecipient, recipient, newRecipient, operator, ...others] = await ethers.getSigners();
      /* deploy helper */
      const Helper = await ethers.getContractFactory('Helper');
      helper = await Helper.deploy();
      await helper.deployed();
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

      /* deploy exchange contract */
      let Exchange = await ethers.getContractFactory("Exchange");
      exchange = await Exchange.deploy(controller.address);
      await exchange.deployed();
      // /* set router address & exchange in controller contract */

      /* deploy erc20 and approve for test */
      let ERC20 = await ethers.getContractFactory("ERC20Test");
      token = await ERC20.connect(buyer).deploy("Tether", "USDT");
      await token.deployed();

      // tx = await token.approve(exchange.address, ethers.utils.parseEther('10000').toString());
      tx = await token.approve(exchange.address, UINT256_MAX);

      await tx.wait();
      /* set platform fee and change recipient */
      tx = await exchange.changeFee(FEE);
      await tx.wait()
      tx = await exchange.changeRecipient(recipient.address);
      await tx.wait()
      // approve exchange
      tx = await controller.approveOrCancel(exchange.address, true);
      await tx.wait();

      // seller enable router
      tx = await controller.connect(seller).registerRouter();
      await tx.wait();

      /**
       * Below we create multiple types of order pairs:
       * order_0: standard order pairs using ETH without royalty
       * order_1: standard order pairs using ETH with royalty
       * order_2: standard order pairs using ERC20 without royalty
       * order_3: standard order pairs using ERC20 with royalty
       * order_4: lazy-mint order pairs using ETH without royalty
       * order_5: lazy-mint order pairs using ERC20 without royalty
       * order_6: standard order pairs using ERC20 with royalty (Auction)
       * order_7: lazy-mint order pairs using ERC20 without royalty (Auction)
       */

      // generate order pairs: pay eth to transfer erc721, no royalty
      buy_order_0 = new Order(
        exchange.address,
        true,
        false,
        buyer.address,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        0,
        committable.address,
        encodeTransfer(ZERO_ADDRESS, buyer.address, tokenId_0),
        encodeTransferReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_0 = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        0,
        committable.address,
        encodeTransfer(seller.address, ZERO_ADDRESS, tokenId_0, DEADLINE),
        encodeTransferReplacement(false),
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
        false,
        buyer.address,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        ROYALTY,
        committable.address,
        encodeTransfer(ZERO_ADDRESS, buyer.address, tokenId_1),
        encodeTransferReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_1 = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        ROYALTY,
        committable.address,
        encodeTransfer(seller.address, ZERO_ADDRESS, tokenId_1, DEADLINE),
        encodeTransferReplacement(false),
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
        false,
        buyer.address,
        token.address,
        PRICE,
        royaltyRecipient.address,
        0,
        committable.address,
        encodeTransfer(ZERO_ADDRESS, buyer.address, tokenId_2),
        encodeTransferReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_2 = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        token.address,
        PRICE,
        royaltyRecipient.address,
        0,
        committable.address,
        encodeTransfer(seller.address, ZERO_ADDRESS, tokenId_2, DEADLINE),
        encodeTransferReplacement(false),
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
        false,
        buyer.address,
        token.address,
        PRICE,
        royaltyRecipient.address,
        ROYALTY,
        committable.address,
        encodeTransfer(ZERO_ADDRESS, buyer.address, tokenId_3),
        encodeTransferReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_3 = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        token.address,
        PRICE,
        royaltyRecipient.address,
        ROYALTY,
        committable.address,
        encodeTransfer(seller.address, ZERO_ADDRESS, tokenId_3, DEADLINE),
        encodeTransferReplacement(false),
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
      let signature_4 = await seller.signMessage(ethers.utils.arrayify(hashMint(seller.address, tokenId_4)));

      buy_order_4 = new Order(
        exchange.address,
        true,
        false,
        buyer.address,
        ZERO_ADDRESS,
        PRICE,
        ZERO_ADDRESS,
        0,
        committable.address,
        encodeMintAndTransfer(ZERO_ADDRESS, buyer.address, tokenId_4),
        encodeMintAndTransferReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_4 = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        ZERO_ADDRESS,
        PRICE,
        ZERO_ADDRESS,
        0,
        committable.address,
        encodeMintAndTransfer(seller.address, ZERO_ADDRESS, tokenId_4, signature_4),
        encodeMintAndTransferReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )


      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_4 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_4)));
      sell_order_sig_4 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_4)));

      // generate order pairs: pay erc20 to mint erc721, no royalty
      // sign tokenId from server
      let signature_5 = await seller.signMessage(ethers.utils.arrayify(hashMint(seller.address, tokenId_5)));

      buy_order_5 = new Order(
        exchange.address,
        true,
        false,
        buyer.address,
        token.address,
        PRICE,
        ZERO_ADDRESS,
        0,
        committable.address,
        encodeMintAndTransfer(ZERO_ADDRESS, buyer.address, tokenId_5),
        encodeMintAndTransferReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_5 = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        token.address,
        PRICE,
        ZERO_ADDRESS,
        0,
        committable.address,
        encodeMintAndTransfer(seller.address, ZERO_ADDRESS, tokenId_5, signature_5),
        encodeMintAndTransferReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )

      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_5 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_5)));
      sell_order_sig_5 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_5)));

      // generate order pairs: pay erc20 to transfer erc721, have royalty (Auction type)
      buy_order_6 = new Order(
        exchange.address,
        true,
        true,
        buyer.address,
        token.address,
        PRICE,
        royaltyRecipient.address,
        ROYALTY,
        committable.address,
        encodeTransfer(ZERO_ADDRESS, buyer.address, tokenId_6),
        encodeTransferReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_6 = new Order(
        exchange.address,
        false,
        true,
        seller.address,
        token.address,
        PRICE,
        royaltyRecipient.address,
        ROYALTY,
        committable.address,
        encodeTransfer(seller.address, ZERO_ADDRESS, tokenId_6, DEADLINE),
        encodeTransferReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )

      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_6 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_6)));
      sell_order_sig_6 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_6)));

      // generate order pairs: pay erc20 to mint erc721, no royalty (Auction type)
      // sign tokenId from server
      let signature_7 = await seller.signMessage(ethers.utils.arrayify(hashMint(seller.address, tokenId_7)));

      buy_order_7 = new Order(
        exchange.address,
        true,
        true,
        buyer.address,
        token.address,
        PRICE,
        ZERO_ADDRESS,
        0,
        committable.address,
        encodeMintAndTransfer(ZERO_ADDRESS, buyer.address, tokenId_7),
        encodeMintAndTransferReplacement(true),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_7 = new Order(
        exchange.address,
        false,
        true,
        seller.address,
        token.address,
        PRICE,
        ZERO_ADDRESS,
        0,
        committable.address,
        encodeMintAndTransfer(seller.address, ZERO_ADDRESS, tokenId_7, signature_7),
        encodeMintAndTransferReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )

      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_7 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_7)));
      sell_order_sig_7 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_7)));




    })

    shouldWorkWithLegitimateBehavior();
    shouldRevertWithMaliciousBehavior();
  })
})