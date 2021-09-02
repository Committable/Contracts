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

  context('with minted tokens and initialized orders', () => {
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

      // deploy erc20 and approve for test
      let ERC20 = await ethers.getContractFactory("USDT");
      token = await ERC20.connect(buyer).deploy("Tether", "USDT");
      await token.deployed();
      tx = await token.approve(exchange.address, ethers.utils.parseEther('100').toString());
      await tx.wait();
      // mint nft to seller
      tx = await tokenProxy['safeMint(address,uint256)'](seller.address, firstTokenId);
      await tx.wait();
      tx = await tokenProxy['safeMint(address,uint256)'](seller.address, secondTokenId);
      await tx.wait();

      price = ethers.utils.parseEther('1').toString()
      buy_order = new Order(
        exchange.address,
        true,
        false,
        buyer.address,
        new BuyAsset(ETH_CLASS, ZERO_ADDRESS, price),
        new NftAsset(tokenProxy.address, firstTokenId, patentFee),
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      sell_order = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        new BuyAsset(ETH_CLASS, ZERO_ADDRESS, price),
        new NftAsset(tokenProxy.address, firstTokenId, patentFee),
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order)));
      sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order)));
      // non auction type using erc20
      buy_order_1 = new Order(
        exchange.address,
        true,
        false,
        buyer.address,
        new BuyAsset(ERC20_CLASS, token.address, price),
        new NftAsset(tokenProxy.address, firstTokenId, patentFee),
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      sell_order_1 = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        new BuyAsset(ERC20_CLASS, token.address, price),
        new NftAsset(tokenProxy.address, firstTokenId, patentFee),
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
        new BuyAsset(ERC20_CLASS, token.address, price),
        new NftAsset(tokenProxy.address, firstTokenId, patentFee),
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      sell_order_2 = new Order(
        exchange.address,
        false,
        true,
        seller.address,
        new BuyAsset(ERC20_CLASS, token.address, price),
        new NftAsset(tokenProxy.address, firstTokenId, patentFee),
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
      sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
    })

    context("with legitimate behaviors: non-auction type using ETH", () => {
      context("check orders hash and signature", () => {
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
        it('both orders were flagged as valid', async () => {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order))).to.equal(true);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order))).to.equal(true);
        })
      })

      context('when match order is triggered by buyer', async () => {
        it('emit desired exchange event', async () => {
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
          expect(tx).to.emit(exchange, 'OrderMatched')
            .withArgs(hashOrder(buy_order), hashOrder(sell_order), buyer.address, seller.address, firstTokenId, sell_order.isAuction, buy_order.buyAsset.value);
        })
        it('emit desired tokenProxy event', async () => {
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
          expect(tx).to.emit(tokenProxy, 'Transfer')
            .withArgs(seller.address, buyer.address, firstTokenId);
        })
      })

      context("when match order is triggered by buyer", () => {
        beforeEach(async () => {
          originalBuyerBalance = await buyer.getBalance();
          originalSellerBalance = await seller.getBalance();
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
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
        it('both orders were flagged as finished', async () => {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order))).to.equal(false);
        })
      })
    })



    context('with malicious behaviors: all types', () => {
      context('when buy order is modified', () => {
        it('revert with non-auction orders using ETH', async () => {
          try {
            buy_order.buyAsset.value = '100000';
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder signature validation failed');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          try {
            buy_order_1.buyAsset.value = '100000';
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder signature validation failed');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          try {
            buy_order_2.buyAsset.value = '100000';
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder signature validation failed');
          }
        })
      })
      context('when sell order is modified', () => {
        it('revert with non-auction orders using ETH', async () => {
          try {
            sell_order.nftAsset.contractAddress = ZERO_ADDRESS;
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sellOrder signature validation failed');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          try {
            sell_order_1.nftAsset.contractAddress = ZERO_ADDRESS;
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sellOrder signature validation failed');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          try {
            sell_order_2.nftAsset.contractAddress = ZERO_ADDRESS;
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sellOrder signature validation failed');
          }
        })
      })


      context('when buy order exchange address does not match', () => {
        it('revert with non-auction orders using ETH', async () => {
          try {
            buy_order.exchange = ZERO_ADDRESS;
            buy_order_sig = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order)));
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          try {
            buy_order_1.exchange = ZERO_ADDRESS;
            buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          try {
            buy_order_2.exchange = ZERO_ADDRESS;
            buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
      })
      context('when sell order exchange address does not match', () => {
        it('revert with non-auction orders using ETH', async () => {
          try {
            sell_order.exchange = ZERO_ADDRESS;
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order)));
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          try {
            sell_order_1.exchange = ZERO_ADDRESS;
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          try {
            sell_order_2.exchange = ZERO_ADDRESS;
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
      })
      context('when pair two buy orders', () => {
        it('revert with non-auction orders using ETH', async () => {
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, buy_order, buy_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, buy_order_1, buy_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, buy_order_2, buy_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
      })
      context('when pair two sell orders', () => {
        it('revert with non-auction orders using ETH', async () => {
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(sell_order, sell_order_sig, buy_order, buy_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
        it('revert with non-auction orders using ERc20', async () => {
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(sell_order_1, sell_order_sig_1, buy_order_1, buy_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(sell_order_2, sell_order_sig_2, buy_order_2, buy_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
      })
      context('when order transaction type does not match', () => {
        it('revert with non-auction orders using ETH', async () => {
          try {
            sell_order.isAuction = true;
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order)));
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order transaction type does not match');
          }
        })

      })

      context('when order transaction type does not match', () => {
        it('revert with non-auction buy order pairs auction sell order using ERC20', async () => {
          try {
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order transaction type does not match');
          }
        })
      })

      context('when order buyAsset class does not match', () => {
        it('revert with non-auction buy order using ETH pairs non-acution sell order using ERC20', async () => {
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buyAsset assetClass does not match');
          }
        })
      })
      context('when buy order bid price is less than sell order ask price ', () => {
        it('revert with non-auction orders using ETH', async () => {
          buy_order.buyAsset.value = ethers.utils.parseEther('0.9').toString();
          buy_order_sig = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder bid price must be no less than the seller ask price');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          buy_order_1.buyAsset.value = ethers.utils.parseEther('0.9').toString();
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder bid price must be no less than the seller ask price');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          buy_order_2.buyAsset.value = ethers.utils.parseEther('0.9').toString();
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder bid price must be no less than the seller ask price');
          }
        })


      })
      context('when nft contract address does not match', async () => {
        it('revert with non-auction orders using ETH', async () => {
          buy_order.nftAsset.contractAddress = ZERO_ADDRESS;
          buy_order_sig = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order NFT contractAddress does not match');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          buy_order_1.nftAsset.contractAddress = ZERO_ADDRESS;
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order NFT contractAddress does not match');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          buy_order_2.nftAsset.contractAddress = ZERO_ADDRESS;
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order NFT contractAddress does not match');
          }
        })
      })
      context('when tokenID does not match', async () => {
        it('revert with non-auction orders using ETH', async () => {
          buy_order.nftAsset.tokenId = secondTokenId;
          buy_order_sig = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order tokenId does not match');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          buy_order_1.nftAsset.tokenId = secondTokenId;
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order tokenId does not match');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          buy_order_2.nftAsset.tokenId = secondTokenId;
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order tokenId does not match');
          }
        })
      })

      context('when buy order start time has not reached yet', async () => {
        it('revert with non-auction orders using ETH', async () => {
          buy_order.start = Math.floor(Date.now() / 1000) + 1000;
          buy_order_sig = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has not started');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          buy_order_1.start = Math.floor(Date.now() / 1000) + 1000;
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has not started');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          buy_order_2.start = Math.floor(Date.now() / 1000) + 1000;
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has not started');
          }
        })
      })

      context('when sell order start time has not reached yet', async () => {
        it('revert with non-auction orders using ETH', async () => {
          sell_order.start = Math.floor(Date.now() / 1000) + 1000;
          sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has not started');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          sell_order_1.start = Math.floor(Date.now() / 1000) + 1000;
          sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has not started');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          sell_order_2.start = Math.floor(Date.now() / 1000) + 1000;
          sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));

          try {
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has not started');
          }
        })
      })
      context('when buy order has expired', async () => {
        it('revert with non-auction orders using ETH', async () => {
          buy_order.end = Math.floor(Date.now() / 1000);
          buy_order_sig = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          buy_order_1.end = Math.floor(Date.now() / 1000);
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          buy_order_2.end = Math.floor(Date.now() / 1000);
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
      })
      context('when sell order has expired', async () => {
        it('revert with non-auction orders using ETH', async () => {
          sell_order.end = Math.floor(Date.now() / 1000);
          sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          sell_order_1.end = Math.floor(Date.now() / 1000);
          sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          sell_order_2.end = Math.floor(Date.now() / 1000);
          sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
          try {
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
      })
      context('when execute finished order', async () => {
        it('revert with non-auction orders using ETH', async () => {
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          await tx.wait();
          try {
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
      })
      context('when execute cancelled buy order', async () => {
        it('revert with non-auction orders using ETH', async () => {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order_1);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order_2);
          await tx.wait();
          try {
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
      })
      context('when execute cancelled sell order', async () => {
        it('revert with non-auction orders using ETH', async () => {
          let tx = await exchange.connect(seller).cancelOrder(sell_order);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with non-auction orders using ERC20', async () => {
          let tx = await exchange.connect(seller).cancelOrder(sell_order_1);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with auction orders using ERC20', async () => {
          let tx = await exchange.connect(seller).cancelOrder(sell_order_2);
          await tx.wait();
          try {
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
      })

    })

    context('when match order is triggered by invalid user', () => {
      it('revert with non-auction orders using ETH: triggered by seller', async () => {
        try {
          let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
          await tx.wait();
          throw null;
        } catch (err) {
          expect(err.message).to.include('non-auction transaction must be executed by the buyer');
        }
      })
      it('revert with non-auction orders using ERC20: triggered by seller', async () => {
        try {
          let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
          await tx.wait();
          throw null;
        } catch (err) {
          expect(err.message).to.include('non-auction transaction must be executed by the buyer');
        }
      })
      it('revert with auction orders using ERC20: triggered by buyer', async () => {
        try {
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
          await tx.wait();
          throw null;
        } catch (err) {
          expect(err.message).to.include('auction transaction must be executed by the seller');
        }
      })
    })



  })


})

