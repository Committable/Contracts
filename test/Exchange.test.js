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
const life_span = 60 * 60 * 24 * 7 // one week
const PATENT_FEE = 1000; // 10 %
const PLATFORM_FEE = 2000; // 20%

describe('Exchange', () => {
  context("get signers", async () => {
    signers = await ethers.getSigners();
    [seller, buyer, creator, recipient, newRecipient, operator, ...others] = signers;
  })

  context('with minted tokens, initialized orders and fees', () => {
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
      tx = await token.approve(exchange.address, ethers.utils.parseEther('10000').toString());
      await tx.wait();
      // mint nft to seller
      tx = await tokenProxy['safeMint(address,uint256)'](seller.address, firstTokenId);
      await tx.wait();
      tx = await tokenProxy['safeMint(address,uint256)'](creator.address, secondTokenId);
      await tx.wait();
      // set platform fee and transfer recipient
      tx = await exchange.changePlatformFee(PLATFORM_FEE);
      await tx.wait()
      tx = await exchange.changeRecipient(recipient.address);
      await tx.wait()

      price = ethers.utils.parseEther('100').toString()
      buy_order = new Order(
        exchange.address,
        true,
        false,
        buyer.address,
        new BuyAsset(ETH_CLASS, ZERO_ADDRESS, price),
        new NftAsset(tokenProxy.address, firstTokenId, PATENT_FEE),
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
        new NftAsset(tokenProxy.address, firstTokenId, PATENT_FEE),
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
        new NftAsset(tokenProxy.address, firstTokenId, PATENT_FEE),
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
        new NftAsset(tokenProxy.address, firstTokenId, PATENT_FEE),
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
        new NftAsset(tokenProxy.address, firstTokenId, PATENT_FEE),
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
        new NftAsset(tokenProxy.address, firstTokenId, PATENT_FEE),
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
      sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));

    })

    context("with legitimate order behaviors", () => {
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

      context("with non-aution ETH orders executed: seller is not creator", () => {
        beforeEach(async () => {
          originalBuyerBalance = await buyer.getBalance();
          originalSellerBalance = await seller.getBalance();
          originalRecipientBalance = await recipient.getBalance();

          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
          gasPrice = tx.gasPrice;
          gasUsed = (await tx.wait()).gasUsed;
          gasFee = gasPrice.mul(gasUsed);
          platformFee = await exchange.getPlatformFee();
          _platformFee = (ethers.BigNumber.from(buy_order.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(platformFee);
          patentFee = await exchange.getPatentFee(buy_order.nftAsset.contractAddress, buy_order.nftAsset.tokenId);
          _patentFee = (ethers.BigNumber.from(buy_order.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(patentFee).toString();

        })
        it('owner of nft token changed', async () => {
          expect(await tokenProxy.ownerOf(firstTokenId)).to.equal(buyer.address);
        })
        it('buyer spends money', async () => {
          let currentBuyerBalance = await buyer.getBalance();
          expect(originalBuyerBalance.sub(currentBuyerBalance).sub(gasFee)).to.equal(price)
        })
        it('seller receive money', async () => {
          let currentSellerBalance = await seller.getBalance();
          expect(currentSellerBalance.sub(originalSellerBalance).add(_platformFee)).to.equal(price)
        })
        it('recipient receive platformFee', async () => {
          let currentRecipientBalance = await recipient.getBalance();
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_platformFee)
        })
        it('both orders were flagged as finished', async () => {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order))).to.equal(false);
        })
      })

      context("with non-aution ETH orders executed: seller is creator", () => {
        beforeEach(async () => {
          // send secondToken to the seller sell, seller is not the creator of this token
          let tx = await tokenProxy.connect(creator).transferFrom(creator.address, seller.address, secondTokenId);
          await tx.wait();
          buy_order.nftAsset.tokenId = secondTokenId;
          buy_order_sig = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order)));
          sell_order.nftAsset.tokenId = secondTokenId;
          sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order)));

          originalBuyerBalance = await buyer.getBalance();
          originalSellerBalance = await seller.getBalance();
          originalRecipientBalance = await recipient.getBalance();
          originalCreatorBalance = await creator.getBalance();

          tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
          gasPrice = tx.gasPrice;
          gasUsed = (await tx.wait()).gasUsed;
          gasFee = gasPrice.mul(gasUsed);
          platformFee = await exchange.getPlatformFee();
          _platformFee = (ethers.BigNumber.from(buy_order.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(platformFee);
          patentFee = await exchange.getPatentFee(buy_order.nftAsset.contractAddress, buy_order.nftAsset.tokenId);
          _patentFee = (ethers.BigNumber.from(buy_order.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(patentFee).toString();

        })
        it('owner of nft token changed', async () => {
          expect(await tokenProxy.ownerOf(secondTokenId)).to.equal(buyer.address);
        })
        it('buyer spends money', async () => {
          let currentBuyerBalance = await buyer.getBalance();
          expect(originalBuyerBalance.sub(currentBuyerBalance).sub(gasFee)).to.equal(price)
        })
        it('seller receive money', async () => {
          let currentSellerBalance = await seller.getBalance();
          expect(currentSellerBalance.sub(originalSellerBalance).add(_platformFee).add(_patentFee)).to.equal(price)
        })
        it('recipient receive platformFee', async () => {
          let currentRecipientBalance = await recipient.getBalance();
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_platformFee)
        })
        it('creator receive patentFee', async () => {
          let currentCreatorBalance = await creator.getBalance();
          expect(currentCreatorBalance.sub(originalCreatorBalance)).to.equal(_patentFee)
        })
        it('both orders were flagged as finished', async () => {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order))).to.equal(false);
        })
      })


      context("with non-aution ERC20 orders executed: seller is not creator", () => {
        beforeEach(async () => {
          originalBuyerBalance = await token.balanceOf(buyer.address);
          originalSellerBalance = await token.balanceOf(seller.address);
          originalRecipientBalance = await token.balanceOf(recipient.address);
          platformFee = await exchange.getPlatformFee();
          _platformFee = (ethers.BigNumber.from(buy_order_1.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(platformFee);
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          await tx.wait();
        })
        it('owner of nft token changed', async () => {
          expect(await tokenProxy.ownerOf(firstTokenId)).to.equal(buyer.address);
        })
        it('buyer spends moeny', async () => {
          let currentBuyerBalance = await token.balanceOf(buyer.address);
          expect(originalBuyerBalance.sub(currentBuyerBalance)).to.equal(price);
        })
        it('seller receive money', async () => {
          let currentSellerBalance = await token.balanceOf(seller.address);
          expect(currentSellerBalance.sub(originalSellerBalance).add(_platformFee)).to.equal(price)
        })
        it('recipient receive platformFee', async () => {
          let currentRecipientBalance = await token.balanceOf(recipient.address);
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_platformFee)
        })
        it('both orders were flagged as finished', async () => {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_1))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_1))).to.equal(false);
        })
      })

      context("with non-aution ERC20 orders executed: seller is creator", () => {
        beforeEach(async () => {
          // send secondToken to the seller sell, seller is not the creator of this token
          let tx = await tokenProxy.connect(creator).transferFrom(creator.address, seller.address, secondTokenId);
          await tx.wait();
          buy_order_1.nftAsset.tokenId = secondTokenId;
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          sell_order_1.nftAsset.tokenId = secondTokenId;
          sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));

          originalBuyerBalance = await token.balanceOf(buyer.address);
          originalSellerBalance = await token.balanceOf(seller.address);
          originalRecipientBalance = await token.balanceOf(recipient.address);
          originalCreatorBalance = await token.balanceOf(creator.address);

          tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          platformFee = await exchange.getPlatformFee();
          _platformFee = (ethers.BigNumber.from(buy_order_1.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(platformFee);
          patentFee = await exchange.getPatentFee(buy_order_1.nftAsset.contractAddress, buy_order_1.nftAsset.tokenId);
          _patentFee = (ethers.BigNumber.from(buy_order_1.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(patentFee).toString();

        })
        it('owner of nft token changed', async () => {
          expect(await tokenProxy.ownerOf(secondTokenId)).to.equal(buyer.address);
        })
        it('buyer spends money', async () => {
          let currentBuyerBalance = await token.balanceOf(buyer.address);
          expect(originalBuyerBalance.sub(currentBuyerBalance)).to.equal(price)
        })
        it('seller receive money', async () => {
          let currentSellerBalance = await token.balanceOf(seller.address);
          expect(currentSellerBalance.sub(originalSellerBalance).add(_platformFee).add(_patentFee)).to.equal(price)
        })
        it('recipient receive platformFee', async () => {
          let currentRecipientBalance = await token.balanceOf(recipient.address);
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_platformFee)
        })
        it('creator receive patentFee', async () => {
          let currentCreatorBalance = await token.balanceOf(creator.address);
          expect(currentCreatorBalance.sub(originalCreatorBalance)).to.equal(_patentFee)
        })
        it('both orders were flagged as finished', async () => {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_1))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_1))).to.equal(false);
        })
      })

      context("with aution ERC20 orders executed: seller is not creator", () => {
        beforeEach(async () => {
          originalBuyerBalance = await token.balanceOf(buyer.address);
          originalSellerBalance = await token.balanceOf(seller.address);
          originalRecipientBalance = await token.balanceOf(recipient.address);
          platformFee = await exchange.getPlatformFee();
          _platformFee = (ethers.BigNumber.from(buy_order_2.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(platformFee);
          let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          await tx.wait();
        })
        it('owner of nft token changed', async () => {
          expect(await tokenProxy.ownerOf(firstTokenId)).to.equal(buyer.address);
        })
        it('buyer spends ether', async () => {
          let currentBuyerBalance = await token.balanceOf(buyer.address);
          expect(originalBuyerBalance.sub(currentBuyerBalance)).to.equal(price);
        })
        it('seller receive ether', async () => {
          let currentSellerBalance = await token.balanceOf(seller.address);
          expect(currentSellerBalance.sub(originalSellerBalance).add(_platformFee)).to.equal(price)
        })
        it('recipient receive platformFee', async () => {
          let currentRecipientBalance = await token.balanceOf(recipient.address);
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_platformFee)
        })
        it('both orders were flagged as finished', async () => {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_2))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_2))).to.equal(false);
        })
      })

      context("with aution ERC20 orders executed: seller is creator", () => {
        beforeEach(async () => {
          // send secondToken to the seller sell, seller is not the creator of this token
          let tx = await tokenProxy.connect(creator).transferFrom(creator.address, seller.address, secondTokenId);
          await tx.wait();
          buy_order_2.nftAsset.tokenId = secondTokenId;
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          sell_order_2.nftAsset.tokenId = secondTokenId;
          sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));

          originalBuyerBalance = await token.balanceOf(buyer.address);
          originalSellerBalance = await token.balanceOf(seller.address);
          originalRecipientBalance = await token.balanceOf(recipient.address);
          originalCreatorBalance = await token.balanceOf(creator.address);

          tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          platformFee = await exchange.getPlatformFee();
          _platformFee = (ethers.BigNumber.from(buy_order_2.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(platformFee);
          patentFee = await exchange.getPatentFee(buy_order_2.nftAsset.contractAddress, buy_order_2.nftAsset.tokenId);
          _patentFee = (ethers.BigNumber.from(buy_order_2.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(patentFee).toString();

        })
        it('owner of nft token changed', async () => {
          expect(await tokenProxy.ownerOf(secondTokenId)).to.equal(buyer.address);
        })
        it('buyer spends money', async () => {
          let currentBuyerBalance = await token.balanceOf(buyer.address);
          expect(originalBuyerBalance.sub(currentBuyerBalance)).to.equal(price)
        })
        it('seller receive money', async () => {
          let currentSellerBalance = await token.balanceOf(seller.address);
          expect(currentSellerBalance.sub(originalSellerBalance).add(_platformFee).add(_patentFee)).to.equal(price)
        })
        it('recipient receive platformFee', async () => {
          let currentRecipientBalance = await token.balanceOf(recipient.address);
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_platformFee)
        })
        it('creator receive patentFee', async () => {
          let currentCreatorBalance = await token.balanceOf(creator.address);
          expect(currentCreatorBalance.sub(originalCreatorBalance)).to.equal(_patentFee)
        })
        it('both orders were flagged as finished', async () => {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_2))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_2))).to.equal(false);
        })
      })

      context('[event test] with non-aution ETH orders executed', async () => {
        it('emit desired exchange event', async () => {
          let platformFee = await exchange.getPlatformFee();
          let patentFee = await exchange.getPatentFee(buy_order.nftAsset.contractAddress, buy_order.nftAsset.tokenId);
          let _platformFee = (ethers.BigNumber.from(buy_order.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(platformFee).toString();
          let _patentFee = (ethers.BigNumber.from(buy_order.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(patentFee).toString();
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
          expect(tx).to.emit(exchange, 'OrderMatched')
            .withArgs(hashOrder(buy_order), hashOrder(sell_order), buyer.address, seller.address, firstTokenId, sell_order.isAuction, buy_order.buyAsset.assetClass, buy_order.buyAsset.contractAddress, buy_order.buyAsset.value, _platformFee, _patentFee);
        })
        it('emit desired tokenProxy event', async () => {
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
          expect(tx).to.emit(tokenProxy, 'Transfer')
            .withArgs(seller.address, buyer.address, firstTokenId);
        })
        it('emit desired fee change event', async () => {
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
          expect(tx).to.emit(exchange, 'PatentFeeChanged')
            .withArgs(buy_order.nftAsset.contractAddress, firstTokenId, '0', PATENT_FEE);
        })
      })

      context('[event test] with non-aution ERC20 orders executed', async () => {
        it('emit desired exchange event', async () => {
          let platformFee = await exchange.getPlatformFee();
          let patentFee = await exchange.getPatentFee(buy_order_1.nftAsset.contractAddress, buy_order_1.nftAsset.tokenId);
          let _platformFee = (ethers.BigNumber.from(buy_order_1.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(platformFee).toString();
          let _patentFee = (ethers.BigNumber.from(buy_order_1.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(patentFee).toString();
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          expect(tx).to.emit(exchange, 'OrderMatched')
            .withArgs(hashOrder(buy_order_1), hashOrder(sell_order_1), buyer.address, seller.address, firstTokenId, sell_order_1.isAuction, buy_order_1.buyAsset.assetClass, buy_order_1.buyAsset.contractAddress, buy_order_1.buyAsset.value, _platformFee, _patentFee);
        })
        it('emit desired tokenProxy event', async () => {
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          expect(tx).to.emit(tokenProxy, 'Transfer')
            .withArgs(seller.address, buyer.address, firstTokenId);
        })
        it('emit desired fee change event', async () => {
          let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          expect(tx).to.emit(exchange, 'PatentFeeChanged')
            .withArgs(buy_order_1.nftAsset.contractAddress, firstTokenId, '0', PATENT_FEE);
        })
      })

      context('[event test] with auction ERC20 orders executed', async () => {
        it('emit desired exchange event', async () => {
          let platformFee = await exchange.getPlatformFee();
          let patentFee = await exchange.getPatentFee(buy_order_2.nftAsset.contractAddress, buy_order_2.nftAsset.tokenId);
          let _platformFee = (ethers.BigNumber.from(buy_order_2.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(platformFee).toString();
          let _patentFee = (ethers.BigNumber.from(buy_order_2.buyAsset.value)).div(ethers.BigNumber.from('10000')).mul(patentFee).toString();
          let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          expect(tx).to.emit(exchange, 'OrderMatched')
            .withArgs(hashOrder(buy_order_2), hashOrder(sell_order_2), buyer.address, seller.address, firstTokenId, sell_order_2.isAuction, buy_order_2.buyAsset.assetClass, buy_order_2.buyAsset.contractAddress, buy_order_2.buyAsset.value, _platformFee, _patentFee);
        })
        it('emit desired tokenProxy event', async () => {
          let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          expect(tx).to.emit(tokenProxy, 'Transfer')
            .withArgs(seller.address, buyer.address, firstTokenId);
        })
        it('emit desired fee change event', async () => {
          let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          expect(tx).to.emit(exchange, 'PatentFeeChanged')
            .withArgs(buy_order_2.nftAsset.contractAddress, firstTokenId, '0', PATENT_FEE);
        })
      })

    })

    context('with malicious order behaviors', () => {
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
          buy_order.start = (await ethers.provider.getBlock('latest')).timestamp.toString() + 10;
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
          buy_order_1.start = (await ethers.provider.getBlock('latest')).timestamp.toString() + 10;
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
          buy_order_2.start = (await ethers.provider.getBlock('latest')).timestamp.toString() + 10;
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
          sell_order.start = (await ethers.provider.getBlock('latest')).timestamp.toString() + 10;
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
          sell_order_1.start = (await ethers.provider.getBlock('latest')).timestamp.toString() + 10;
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
          sell_order_2.start = (await ethers.provider.getBlock('latest')).timestamp.toString() + 10;
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

          buy_order.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
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


          buy_order_1.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
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
          buy_order_2.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
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
          sell_order.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
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
          sell_order_1.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
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
          sell_order_2.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
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

      context('with other malicious order behaviors', () => {
        it('revert with auction orders using ETH', async () => {
          try {
            buy_order.isAuction = true;
            buy_order_sig = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order)));
            sell_order.isAuction = true;
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order)));
            let tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid orders: ETH not allowed in auction');
          }
        })
        it('revert with not paying enough ether in eth non-auction order', async () => {
          try {
            price = ethers.utils.parseEther('0.9').toString()
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ether amount does not match buy order value');
          }
        })
        it('revert with paying too much ether in eth non-auction order', async () => {
          try {
            price = ethers.utils.parseEther('1.1').toString()
            let tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ether amount does not match buy order value');
          }
        })
        it('revert with not approving tokens in erc20 non-auction order', async () => {
          try {
            let tx = await token.connect(buyer).approve(exchange.address, '0');
            await tx;
            tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ERC20: transfer amount exceeds allowance');
          }
        })
        it('revert with not enough tokens in erc20 non-auction order', async () => {
          try {
            let tokenBalance = (await token.balanceOf(buyer.address)).toString();
            let tx = await token.connect(buyer).transfer(exchange.address, tokenBalance);
            await tx.wait();
            tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ERC20: transfer amount exceeds balance');
          }
        })
        it('revert with not approving tokens in erc20 auction order', async () => {
          try {
            let tx = await token.connect(buyer).approve(exchange.address, '0');
            await tx;
            tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ERC20: transfer amount exceeds allowance');
          }
        })
        it('revert with insufficient tokens in erc20 auction order', async () => {
          try {
            let tokenBalance = (await token.balanceOf(buyer.address)).toString();
            let tx = await token.connect(buyer).transfer(exchange.address, tokenBalance);
            await tx.wait();
            tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ERC20: transfer amount exceeds balance');
          }
        })
        it('revert with invalid assetClass in eth non-auction order', async () => {
          try {
            buy_order.buyAsset.assetClass = '0x12345678';
            buy_order_sig = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order)));
            sell_order.buyAsset.assetClass = '0x12345678';
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order)));
            tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('unauthenticated asset type not allowed');
          }
        })
        it('revert with invalid assetClass in erc20 non-auction order', async () => {
          try {
            buy_order_1.buyAsset.assetClass = '0x12345678';
            buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
            sell_order_1.buyAsset.assetClass = '0x12345678';
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('unauthenticated asset type not allowed');
          }
        })
        it('revert with invalid assetClass in erc20 auction order', async () => {
          try {
            buy_order_2.buyAsset.assetClass = '0x12345678';
            buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
            sell_order_2.buyAsset.assetClass = '0x12345678';
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('unauthenticated asset type not allowed');
          }
        })
        it('revert with sending ethers in erc20 non-auction order', async () => {
          try {

            tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sending ether not allowed in ERC20 order');
          }
        })
        it('revert with sending ethers in erc20 auction order', async () => {
          try {

            tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sending ether not allowed in ERC20 order');
          }
        })
        it('revert with invalid patentFee set in ETH non-auction order', async () => {
          try {
            let invalid_patentFee = '10001';
            sell_order.nftAsset.patentFee = invalid_patentFee;
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order)));
            tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order, buy_order_sig, sell_order, sell_order_sig, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid patent fee rate: must no larger than 100%');
          }
        })
        it('revert with invalid patentFee set in ERC20 non-auction order', async () => {
          try {
            let invalid_patentFee = '10001';
            sell_order_1.nftAsset.patentFee = invalid_patentFee;
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            tx = await exchange.connect(buyer).matchAndExecuteOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid patent fee rate: must no larger than 100%');
          }
        })
        it('revert with invalid patentFee set in ERC20 auction order', async () => {
          try {
            let invalid_patentFee = '10001';
            sell_order_2.nftAsset.patentFee = invalid_patentFee;
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            tx = await exchange.connect(seller).matchAndExecuteOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid patent fee rate: must no larger than 100%');
          }
        })
      })

    })

    context('with legitimate user behaviors', () => {
      context('when user cancel owned orders', () => {
        it('buyer should cancel owned orders successfully', async () => {
          await exchange.connect(buyer).cancelOrder(buy_order);
          await exchange.connect(buyer).cancelOrder(buy_order_1);
          await exchange.connect(buyer).cancelOrder(buy_order_2);
          expect(await exchange.checkOrderStatus(hashOrder(buy_order))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_1))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_2))).to.equal(false);
        })
        it('seller should cancel owned orders successfully', async () => {
          await exchange.connect(seller).cancelOrder(sell_order);
          await exchange.connect(seller).cancelOrder(sell_order_1);
          await exchange.connect(seller).cancelOrder(sell_order_2);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_1))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_2))).to.equal(false);
        })
        it('[event test] emit desired cancel events when buyer cancel owned orders', async () => {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(buy_order), buyer.address);
          tx = await exchange.connect(buyer).cancelOrder(buy_order_1);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(buy_order_1), buyer.address);
          tx = await exchange.connect(buyer).cancelOrder(buy_order_2);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(buy_order_2), buyer.address);
        })
        it('[event test] emit desired cancel events when seller cancel owned orders', async () => {
          let tx = await exchange.connect(seller).cancelOrder(sell_order);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(sell_order), seller.address);
          tx = await exchange.connect(seller).cancelOrder(sell_order_1);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(sell_order_1), seller.address);
          tx = await exchange.connect(seller).cancelOrder(sell_order_2);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(sell_order_2), seller.address);
        })
      })

    })

    context('with malicious user behaviors', () => {
      context('when user try to cancels other orders', () => {
        it('revert when others try to cancel seller orders', async () => {
          try {
            let tx = await exchange.connect(buyer).cancelOrder(sell_order);
            throw null
          } catch (err) {
            expect(err.message).to.include('order must be cancelled by its maker');
          }
          try {
            let tx = await exchange.connect(creator).cancelOrder(sell_order_1);
            throw null
          } catch (err) {
            expect(err.message).to.include('order must be cancelled by its maker');
          }
          try {
            let tx = await exchange.connect(buyer).cancelOrder(sell_order_2);
            throw null
          } catch (err) {
            expect(err.message).to.include('order must be cancelled by its maker');
          }
        })
        it('revert when others try to cancel buyer orders', async () => {
          try {
            let tx = await exchange.connect(seller).cancelOrder(buy_order);
            throw null
          } catch (err) {
            expect(err.message).to.include('order must be cancelled by its maker');
          }
          try {
            let tx = await exchange.connect(creator).cancelOrder(buy_order_1);
            throw null
          } catch (err) {
            expect(err.message).to.include('order must be cancelled by its maker');
          }
          try {
            let tx = await exchange.connect(seller).cancelOrder(buy_order_2);
            throw null
          } catch (err) {
            expect(err.message).to.include('order must be cancelled by its maker');
          }
        })

      })
    })

    context('with legitimate admin behaviors', () => {
      context('when admin change platForm fee', () => {
        it('admin should change platForm fee successfully', async () => {
          let platformFee = '3000'
          let tx = await exchange.changePlatformFee(platformFee);
          await tx.wait();
          expect(await exchange.getPlatformFee()).to.equal(platformFee);
        })
        it('[event test] emit desired change platformFee event', async () => {
          let platformFee = '3000'
          let tx = await exchange.changePlatformFee(platformFee);
          expect(tx).to.emit(exchange, 'PlatformFeeChanged').withArgs(PLATFORM_FEE, platformFee);
        })
      })
      context('when admin change recipient', () => {
        it('admin should change recipient fee successfully', async () => {
          let tx = await exchange.changeRecipient(newRecipient.address);
          await tx.wait();
          expect(await exchange.getRecipient()).to.equal(newRecipient.address);
        })
        it('[event test] emit desired change recipient event', async () => {
          let tx = await exchange.changeRecipient(newRecipient.address);
          expect(tx).to.emit(exchange, 'RecipientChanged').withArgs(recipient.address, newRecipient.address);
        })
      })
    })

    context('with malicious admin behaviors', () => {
      context('when admin change invalid platForm fee', () => {
        it('revert when platformFee larger than 100%', async () => {
          let platformFee = '10001';
          try {
            let tx = await exchange.changePlatformFee(platformFee);
            await tx.wait();
            throw null
          } catch (err) {
            expect(err.message).to.include("invalid platform fee rate: must no larger than 100%");
          }
        })
      })
      context('when admin change invalid recipient', () => {
        it('revert when set new recipient as zero address', async () => {
          try {
            let tx = await exchange.changeRecipient(ZERO_ADDRESS);
            await tx.wait();
            throw null;
          } catch(err) {
            expect(err.message).to.include('zero address not allowed');
          }
        })
        it('revert when set new recipient as zero address', async () => {
          try {
            let tx = await exchange.changeRecipient(recipient.address);
            await tx.wait();
            throw null;
          } catch(err) {
            expect(err.message).to.include('same address not allowed');
          }
        })
      })
    })


  })


})

