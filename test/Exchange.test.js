const { expect } = require("chai");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const  ZERO_ADDRESS  = "0x0000000000000000000000000000000000000000";

const { Order, hashOrder, hashMint, DOMAIN, TYPES } = require("./utils.js");
const { projects, commits, tokenIds } = require('./tokenId.js');
const { TypedDataUtils } = require('ethers-eip712')
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4, tokenId_5, tokenId_6, tokenId_7 } = tokenIds;
const { shouldWorkWithLegitimateBehavior } = require('./Exchange.legitimate.behavior.js');
const { shouldRevertWithMaliciousBehavior } = require('./Exchange.malicious.behavior.js')

ROYALTY = '1000'; // 10%
const life_span = 60 * 60 * 24 * 7 // one week
FEE = '1000' // 10%
PRICE = ethers.utils.parseEther('100').toString();

DEADLINE = 0;
UINT256_MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
UINT256_ZERO = '0x00'
domain = DOMAIN
types = TYPES


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
      controller = await Controller.deploy(seller.address); // seller address is token signer
      await controller.deployed();
      /* deploy token logic contract */
      let ERC721Committable = await ethers.getContractFactory("ERC721Committable");
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
      tokenProxy = await ERC721Committable.attach(tokenProxy.address);

      /* deploy exchange contract */
      let Exchange = await ethers.getContractFactory("Exchange");
      exchange = await Exchange.deploy(controller.address);
      await exchange.deployed();

      domain.verifyingContract = exchange.address
      /* deploy transferProxy contract */
      let TransferProxy = await ethers.getContractFactory("TransferProxy");
      transferProxy = await TransferProxy.deploy(controller.address);
      await transferProxy.deployed();



      /* deploy erc20 and approve for test */
      let ERC20 = await ethers.getContractFactory("USDTMock");
      token = await ERC20.connect(buyer).deploy("USDTMock", "USDT-M");
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

      // register transferProxy
      tx = await controller.registerTransferProxy(transferProxy.address);
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

      buy_order_0 = {
        isBuySide: true,
        isAuction: false,
        maker: buyer.address,
        paymentToken: ZERO_ADDRESS,
        value: PRICE,
        royaltyRecipient: royaltyRecipient.address,
        royalty: 0,
        target: tokenProxy.address,
        tokenId: tokenId_0,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }

      sell_order_0 = {
        isBuySide: false,
        isAuction: false,
        maker: seller.address,
        paymentToken: ZERO_ADDRESS,
        value: PRICE,
        royaltyRecipient: royaltyRecipient.address,
        royalty: 0,
        target: tokenProxy.address,
        tokenId: tokenId_0,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first

      buy_order_sig_0 = await buyer._signTypedData(domain, types, buy_order_0);
      sell_order_sig_0 = await seller._signTypedData(domain, types, sell_order_0);

      // typedData = {
      //   types: {
      //     EIP712Domain: [
      //       { name: "name", type: "string" },
      //       { name: "version", type: "string" },
      //       { name: "chainId", type: "uint256" },
      //       { name: "verifyingContract", type: "address" },
      //     ],
      //     Order: [
      //       { name: 'isBuySide', type: 'bool' },
      //       { name: 'isAuction', type: 'bool' },
      //       { name: 'maker', type: 'address' },
      //       { name: 'paymentToken', type: 'address' },
      //       { name: 'value', type: 'uint256' },
      //       { name: 'royaltyRecipient', type: 'address' },
      //       { name: 'royaty', type: 'uint256' },
      //       { name: 'target', type: 'address' },
      //       { name: 'tokenId', type: 'uint256' },
      //       { name: 'tokenSig', type: 'bytes' },
      //       { name: 'start', type: 'uint256' },
      //       { name: 'end', type: 'uint256' },
      //       { name: 'salt', type: 'uint256' },
      //     ]
      //   },
      //   primaryType: 'Order',
      //   domain: {
      //     name: 'Exchange',
      //     version: '1',
      //     chainId: 1,
      //     verifyingContract: exchange.address
      //   },
      //   message: sell_order_0
      // }

      // console.log(seller.address)
      // console.log(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Order(bool isBuySide,bool isAuction,address maker,address paymentToken,uint256 value,address royaltyRecipient,uint256 royalty,address target,uint256 tokenId,bytes tokenSig,uint256 start,uint256 end,uint256 salt)")))
      // let result = ethers.utils.verifyTypedData(domain, types, sell_order_0, sell_order_sig_0)
      // console.log(result)
      // sell_order_sig_0 = await seller.signMessage(digestHex);

      // buy_order_sig_0 = await buyer._signTypedData(domain, types, buy_order_0)
      // sell_order_sig_0 = await seller._signTypedData(domain, types, sell_order_0);
      // generate order pairs: pay eth to transfer erc721: have royalty

      buy_order_1 = {
        isBuySide: true,
        isAuction: false,
        maker: buyer.address,
        paymentToken: ZERO_ADDRESS,
        value: PRICE,
        royaltyRecipient: royaltyRecipient.address,
        royalty: ROYALTY,
        target: tokenProxy.address,
        tokenId: tokenId_1,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }

      sell_order_1 = {
        isBuySide: false,
        isAuction: false,
        maker: seller.address,
        paymentToken: ZERO_ADDRESS,
        value: PRICE,
        royaltyRecipient: royaltyRecipient.address,
        royalty: ROYALTY,
        target: tokenProxy.address,
        tokenId: tokenId_1,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first

      buy_order_sig_1 = await buyer._signTypedData(domain, types, buy_order_1);
      sell_order_sig_1 = await seller._signTypedData(domain, types, sell_order_1);
      // generate order pairs: pay erc20 to transfer erc721, no royalty

      buy_order_2 = {
        isBuySide: true,
        isAuction: false,
        maker: buyer.address,
        paymentToken: token.address,
        value: PRICE,
        royaltyRecipient: royaltyRecipient.address,
        royalty: 0,
        target: tokenProxy.address,
        tokenId: tokenId_2,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }

      sell_order_2 = {
        isBuySide: false,
        isAuction: false,
        maker: seller.address,
        paymentToken: token.address,
        value: PRICE,
        royaltyRecipient: royaltyRecipient.address,
        royalty: 0,
        target: tokenProxy.address,
        tokenId: tokenId_2,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_2 = await buyer._signTypedData(domain, types, buy_order_2);
      sell_order_sig_2 = await seller._signTypedData(domain, types, sell_order_2);

      // generate order pairs: pay erc20 to transfer erc721, have royalty

      buy_order_3 = {
        isBuySide: true,
        isAuction: false,
        maker: buyer.address,
        paymentToken: token.address,
        value: PRICE,
        royaltyRecipient: royaltyRecipient.address,
        royalty: ROYALTY,
        target: tokenProxy.address,
        tokenId: tokenId_3,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }

      sell_order_3 = {
        isBuySide: false,
        isAuction: false,
        maker: seller.address,
        paymentToken: token.address,
        value: PRICE,
        royaltyRecipient: royaltyRecipient.address,
        royalty: ROYALTY,
        target: tokenProxy.address,
        tokenId: tokenId_3,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      buy_order_sig_3 = await buyer._signTypedData(domain, types, buy_order_3);
      sell_order_sig_3 = await seller._signTypedData(domain, types, sell_order_3);

      // generate order pairs: pay eth to mint erc721, no royalty
      // sign tokenId from server
      let signature_4 = await seller.signMessage(ethers.utils.arrayify(hashMint(seller.address, tokenId_4)));


      buy_order_4 = {
        isBuySide: true,
        isAuction: false,
        maker: buyer.address,
        paymentToken: ZERO_ADDRESS,
        value: PRICE,
        royaltyRecipient: ZERO_ADDRESS,
        royalty: 0,
        target: tokenProxy.address,
        tokenId: tokenId_4,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }

      sell_order_4 = {
        isBuySide: false,
        isAuction: false,
        maker: seller.address,
        paymentToken: ZERO_ADDRESS,
        value: PRICE,
        royaltyRecipient: ZERO_ADDRESS,
        royalty: 0,
        target: tokenProxy.address,
        tokenId: tokenId_4,
        tokenSig: signature_4,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }

      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_4 = await buyer._signTypedData(domain, types, buy_order_4);
      sell_order_sig_4 = await seller._signTypedData(domain, types, sell_order_4);

      // generate order pairs: pay erc20 to mint erc721, no royalty
      // sign tokenId from server
      let signature_5 = await seller.signMessage(ethers.utils.arrayify(hashMint(seller.address, tokenId_5)));

      buy_order_5 = {
        isBuySide: true,
        isAuction: false,
        maker: buyer.address,
        paymentToken: token.address,
        value: PRICE,
        royaltyRecipient: ZERO_ADDRESS,
        royalty: 0,
        target: tokenProxy.address,
        tokenId: tokenId_5,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }

      sell_order_5 = {
        isBuySide: false,
        isAuction: false,
        maker: seller.address,
        paymentToken: token.address,
        value: PRICE,
        royaltyRecipient: ZERO_ADDRESS,
        royalty: 0,
        target: tokenProxy.address,
        tokenId: tokenId_5,
        tokenSig: signature_5,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_5 = await buyer._signTypedData(domain, types, buy_order_5);
      sell_order_sig_5 = await seller._signTypedData(domain, types, sell_order_5);

      // generate order pairs: pay erc20 to transfer erc721, have royalty (Auction type)

      buy_order_6 = {
        isBuySide: true,
        isAuction: true,
        maker: buyer.address,
        paymentToken: token.address,
        value: PRICE,
        royaltyRecipient: royaltyRecipient.address,
        royalty: ROYALTY,
        target: tokenProxy.address,
        tokenId: tokenId_6,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }

      sell_order_6 = {
        isBuySide: false,
        isAuction: true,
        maker: seller.address,
        paymentToken: token.address,
        value: PRICE,
        royaltyRecipient: royaltyRecipient.address,
        royalty: ROYALTY,
        target: tokenProxy.address,
        tokenId: tokenId_6,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_6 = await buyer._signTypedData(domain, types, buy_order_6);
      sell_order_sig_6 = await seller._signTypedData(domain, types, sell_order_6);

      // generate order pairs: pay erc20 to mint erc721, no royalty (Auction type)
      // sign tokenId from server
      let signature_7 = await seller.signMessage(ethers.utils.arrayify(hashMint(seller.address, tokenId_7)));


      buy_order_7 = {
        isBuySide: true,
        isAuction: true,
        maker: buyer.address,
        paymentToken: token.address,
        value: PRICE,
        royaltyRecipient: ZERO_ADDRESS,
        royalty: 0,
        target: tokenProxy.address,
        tokenId: tokenId_7,
        tokenSig: UINT256_ZERO,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }

      sell_order_7 = {
        isBuySide: false,
        isAuction: true,
        maker: seller.address,
        paymentToken: token.address,
        value: PRICE,
        royaltyRecipient: ZERO_ADDRESS,
        royalty: 0,
        target: tokenProxy.address,
        tokenId: tokenId_7,
        tokenSig: signature_7,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_7 = await buyer._signTypedData(domain, types, buy_order_7);
      sell_order_sig_7 = await seller._signTypedData(domain, types, sell_order_7);




    })

    shouldWorkWithLegitimateBehavior();
    shouldRevertWithMaliciousBehavior();
  })
})