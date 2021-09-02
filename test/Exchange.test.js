const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.setting.js');
const ether = require("@openzeppelin/test-helpers/src/ether");
const { ZERO_ADDRESS } = constants;
const { BuyAsset, hashAsset, NftAsset, hashNft, Order, hashOrder } = require("../utils.js");

const firstTokenId = 5042;
const secondTokenId = '0x79217';
const nonExistentTokenId = '13';
const fourthTokenId = 4;
const ETH_CLASS = '0xaaaebeba';
const ERC20_CLASS = '0x8ae85d84';
const patentFee = 1000; // 10 %
const life_span = 60 * 60 * 24 * 7 // one week

describe('Exchange', () => {
  // let oxERC721Upgradeable, proxyController, tokenProxy, transferProxy, exchange, signers,
  //   buy_asset, nft_asset, buy_order, sell_order, buy_order_sig, sell_order_sig;

  context("get signers", async () => {
    signers = await ethers.getSigners();
    [seller, buyer, approved, operator, ...others] = signers;
    // signers.forEach((signer) => {
    //   console.log(signer.address);
    // })
  })

  context('with minted tokens and initialized values', () => {
    beforeEach(async () => {
      // deploy contracts here
      OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
      oxERC721Upgradeable = await OxERC721Upgradeable.deploy();
      await oxERC721Upgradeable.deployed();

      let ProxyController = await ethers.getContractFactory("ProxyController");
      proxyController = await ProxyController.deploy();
      await proxyController.deployed();

      let TokenProxy = await ethers.getContractFactory("TokenProxy");
      let ABI = ["function initialize(string,string,address)"];
      let iface = new ethers.utils.Interface(ABI);
      let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, proxyController.address]);
      tokenProxy = await TokenProxy.deploy(oxERC721Upgradeable.address, proxyController.address, calldata);
      await tokenProxy.deployed();
      tokenProxy = await OxERC721Upgradeable.attach(tokenProxy.address);

      let TransferProxy = await ethers.getContractFactory("TransferProxy");
      transferProxy = await TransferProxy.deploy(proxyController.address);
      await transferProxy.deployed();

      let Exchange = await ethers.getContractFactory("Exchange");
      exchange = await Exchange.deploy(proxyController.address);
      await exchange.deployed();

      let tx = await proxyController.grantAuthentication(exchange.address);
      await tx.wait();
      tx = await proxyController.setProxy(transferProxy.address);
      await tx.wait();

      tx = await tokenProxy['safeMint(address,uint256)'](seller.address, firstTokenId);
      await tx.wait();
      tx = await tokenProxy['safeMint(address,uint256)'](seller.address, secondTokenId);
      await tx.wait();

    })

    context("non-auction order pairs using ETH", () => {
      beforeEach(async () => {
        price = ethers.utils.parseEther('1').toString()
        buy_asset = new BuyAsset(ETH_CLASS, ZERO_ADDRESS, price)
        nft_asset = new NftAsset(tokenProxy.address, firstTokenId, patentFee);
        buy_order = new Order(
          exchange.address,
          true,
          false,
          buyer.address,
          buy_asset,
          nft_asset,
          Math.floor(Math.random() * 10000),
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000 + life_span)
        )
        sell_order = new Order(
          exchange.address,
          false,
          false,
          seller.address,
          buy_asset,
          nft_asset,
          Math.floor(Math.random() * 10000),
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000 + life_span)
        )
        // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
        buy_order_sig = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order)));
        sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order)));

      })
      context("check on-chain and off-chain hash values and signatures", () => {
        it('buy_asset on-chain and off-chain hash match', async () => {
          expect(await exchange.getAssetHash(buy_asset)).to.equal(hashAsset(buy_asset));
        })
        it('nft_asset on-chain and off-chain hash match', async () => {
          expect(await exchange.getNftHash(nft_asset)).to.equal(hashNft(nft_asset));
        })
        it('buy_order on-chain and off-chain hash match', async () => {
          expect(await exchange.getOrderHash(buy_order)).to.equal(hashOrder(buy_order));
        })
        it('sell_order on-chain and off-chain hash match', async () => {
          expect(await exchange.getOrderHash(sell_order)).to.equal(hashOrder(sell_order));
        })
        it('buy_order signature pass verification', async () => {
          expect(await exchange.getRecover(buy_order, buy_order_sig)).to.equal(buyer.address);
        })
        it('sell_order signature pass verification', async () => {
          expect(await exchange.getRecover(sell_order, sell_order_sig)).to.equal(seller.address);
        })
      })

      context("pair orders and execute by buyers", () => {
        beforeEach(async () => {
          originalBuyerBalance = await buyer.getBalance();
          originalSellerBalance = await seller.getBalance();
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, {value: price});
          gasPrice = tx.gasPrice;
          gasUsed = (await tx.wait()).gasUsed;
          gasFee = gasPrice.mul(gasUsed);
        })
        it('owner of nft token changed', async () => {
          expect(await tokenProxy.ownerOf(firstTokenId)).to.equal(buyer.address);
        })
        it('buyer spends ether', async () => {
          let currentBuyerBalance = await buyer.getBalance();
          expect(originalBuyerBalance.sub(currentBuyerBalance).sub(gasFee)).to.equal(price)
        })
        it('seller receive ether', async () => {
          let currentSellerBalance = await seller.getBalance();
          expect(currentSellerBalance.sub(originalSellerBalance)).to.equal(price)
        })
      })




    })









  })


})

