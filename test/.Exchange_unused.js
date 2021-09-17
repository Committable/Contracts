const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;
const { CommitInfo, hashCommitInfo, Asset, hashAsset, Order, hashOrder } = require("./utils.js");
const { tokenIds, commitInfo } = require('./commitInfo.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4 } = tokenIds;
const { commitInfo_0, commitInfo_1, commitInfo_2, commitInfo_3, commitInfo_4 } = commitInfo;

const ETH_CLASS = '0xaaaebeba';
const ERC20_CLASS = '0x8ae85d84';
const ERC721_CLASS = '0x73ad2146';

const life_span = 60 * 60 * 24 * 7 // one week
const ROYALTY = 1000; // 10 %
const FEE = 2000; // 20%


let seller, buyer, creator, recipient, newRecipient, operator, others;
let tokenProxy, exchange, oxERC721Upgradeable, router, controller;
let buy_order_0, buy_order_1, buy_order_2, buy_order_tmp, sell_order_0, sell_order_1, sell_order_2, sell_order_tmp;
let buy_order_sig_0, buy_order_sig_1, buy_order_sig_2, buy_order_sig_tmp, sell_order_sig_0, sell_order_sig_1, sell_order_sig_2, sell_order_sig_tmp;
describe('Exchange', function () {


  context('with minted tokens, initialized orders and fees', function () {
    beforeEach(async function () {
      // get signer
      [seller, buyer, creator, recipient, newRecipient, operator, ...others] = await ethers.getSigners();

      // deploy contracts here
      OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
      oxERC721Upgradeable = await OxERC721Upgradeable.deploy();
      await oxERC721Upgradeable.deployed();

      let Controller = await ethers.getContractFactory("Controller");
      controller = await Controller.deploy();
      await controller.deployed();

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
      // sign some tokens commit info
      let commitInfo_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_0)));
      let commitInfo_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_1)));
      // mint tokenId_0 to seller, tokenId_1 to creator
      tx = await tokenProxy.mint(seller.address, tokenId_0, commitInfo_0, commitInfo_sig_0);
      await tx.wait();
      tx = await tokenProxy.mint(creator.address, tokenId_1, commitInfo_1, commitInfo_sig_1);
      await tx.wait();
      // set platform fee and transfer recipient
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
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_0),
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
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_0),
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
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_0),
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
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_0),
        ROYALTY,
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
      sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));

      // non-auction type using ether: seller purchases nft from creator 
      buy_order_tmp = new Order(
        exchange.address,
        true,
        false,
        seller.address,
        new Asset(ETH_CLASS, ZERO_ADDRESS, price),
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_1),
        ROYALTY,
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      sell_order_tmp = new Order(
        exchange.address,
        false,
        false,
        creator.address,
        new Asset(ETH_CLASS, ZERO_ADDRESS, price),
        new Asset(ERC721_CLASS, tokenProxy.address, tokenId_1),
        ROYALTY,
        Math.floor(Math.random() * 10000),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000 + life_span)
      )
      buy_order_sig_tmp = await seller.signMessage(ethers.utils.arrayify(hashOrder(buy_order_tmp)));
      sell_order_sig_tmp = await creator.signMessage(ethers.utils.arrayify(hashOrder(sell_order_tmp)));

    })

    context("with legitimate order behaviors", function () {
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

      context("with non-aution ETH orders executed: seller is creator", function () {
        beforeEach(async function () {
          originalBuyerBalance = await buyer.getBalance();
          originalSellerBalance = await seller.getBalance();
          originalRecipientBalance = await recipient.getBalance();
          fee = await exchange.getFee();
          _fee = (ethers.BigNumber.from(buy_order_0.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(fee);
          royalty = await exchange.getRoyalty(buy_order_0.sellSideAsset.contractAddress, buy_order_0.sellSideAsset.amountOrId);
          _royalty = (ethers.BigNumber.from(buy_order_0.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();

          let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
          gasPrice = tx.gasPrice;
          gasUsed = (await tx.wait()).gasUsed;
          gasFee = gasPrice.mul(gasUsed);

        })
        it('owner of nft token changed', async function () {
          expect(await tokenProxy.ownerOf(tokenId_0)).to.equal(buyer.address);
        })
        it('buyer spends money', async function () {
          let currentBuyerBalance = await buyer.getBalance();

          expect(originalBuyerBalance.sub(currentBuyerBalance).sub(gasFee)).to.equal(price)
        })
        it('seller receive money', async function () {
          let currentSellerBalance = await seller.getBalance();
          expect(currentSellerBalance.sub(originalSellerBalance).add(_fee).add(_royalty)).to.equal(price)
        })
        it('recipient receive fee', async function () {
          let currentRecipientBalance = await recipient.getBalance();
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_fee)
        })
        it('both orders were flagged as finished', async function () {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_0))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_0))).to.equal(false);
        })
        it('both orders were flagged as finished via batch request', async function () {
          expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_0), hashOrder(sell_order_0)])).
            to.deep.equal([false, false]);
        })
      })

      context("with non-aution ETH orders executed: seller is not creator", function () {
        beforeEach(async function () {
          // seller purchase nft(tokenId_1) from creator, patent fee was set
          let tx = await exchange.connect(seller).matchOrder(buy_order_tmp, buy_order_sig_tmp, sell_order_tmp, sell_order_sig_tmp, { value: price })
          buy_order_0.sellSideAsset.amountOrId = tokenId_1;
          buy_order_sig_0= await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
          sell_order_0.sellSideAsset.amountOrId = tokenId_1;
          sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));

          originalBuyerBalance = await buyer.getBalance();
          originalSellerBalance = await seller.getBalance();
          originalRecipientBalance = await recipient.getBalance();
          originalCreatorBalance = await creator.getBalance();

          fee = await exchange.getFee();
          _fee = (ethers.BigNumber.from(buy_order_0.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(fee);
          royalty = await exchange.getRoyalty(buy_order_0.sellSideAsset.contractAddress, buy_order_0.sellSideAsset.amountOrId);
          _royalty = (ethers.BigNumber.from(buy_order_0.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();

          tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
          gasPrice = tx.gasPrice;
          gasUsed = (await tx.wait()).gasUsed;
          gasFee = gasPrice.mul(gasUsed);

        })
        it('owner of nft token changed', async function () {
          expect(await tokenProxy.ownerOf(tokenId_1)).to.equal(buyer.address);
        })
        it('buyer spends money', async function () {
          let currentBuyerBalance = await buyer.getBalance();
          expect(originalBuyerBalance.sub(currentBuyerBalance).sub(gasFee)).to.equal(price)
        })
        it('seller receive money', async function () {
          let currentSellerBalance = await seller.getBalance();
          expect(currentSellerBalance.sub(originalSellerBalance).add(_fee).add(_royalty)).to.equal(price)
        })
        it('recipient receive fee', async function () {
          let currentRecipientBalance = await recipient.getBalance();
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_fee)
        })
        it('creator receive royalty', async function () {
          let currentCreatorBalance = await creator.getBalance();
          expect(currentCreatorBalance.sub(originalCreatorBalance)).to.equal(_royalty)
        })
        it('both orders were flagged as finished', async function () {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_0))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_0))).to.equal(false);
        })
        it('four orders were flagged as finished via batch request', async function () {
          expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_0), hashOrder(sell_order_0), hashOrder(buy_order_tmp), hashOrder(sell_order_tmp)])).
            to.deep.equal([false, false, false, false]);
        })
      })


      context("with non-aution ERC20 orders executed: seller is creator", function () {
        beforeEach(async function () {
          originalBuyerBalance = await token.balanceOf(buyer.address);
          originalSellerBalance = await token.balanceOf(seller.address);
          originalRecipientBalance = await token.balanceOf(recipient.address);
          fee = await exchange.getFee();
          _fee = (ethers.BigNumber.from(buy_order_1.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(fee);

          let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          await tx.wait();
        })
        it('owner of nft token changed', async function () {
          expect(await tokenProxy.ownerOf(tokenId_0)).to.equal(buyer.address);
        })
        it('buyer spends moeny', async function () {
          let currentBuyerBalance = await token.balanceOf(buyer.address);
          expect(originalBuyerBalance.sub(currentBuyerBalance)).to.equal(price);
        })
        it('seller receive money', async function () {
          let currentSellerBalance = await token.balanceOf(seller.address);
          expect(currentSellerBalance.sub(originalSellerBalance).add(_fee)).to.equal(price)
        })
        it('recipient receive fee', async function () {
          let currentRecipientBalance = await token.balanceOf(recipient.address);
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_fee)
        })
        it('both orders were flagged as finished', async function () {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_1))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_1))).to.equal(false);
        })
        it('both orders were flagged as finished via batch request', async function () {
          expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_1), hashOrder(sell_order_1)])).
            to.deep.equal([false, false]);
        })
      })

      context("with non-aution ERC20 orders executed: seller is not creator", function () {
        beforeEach(async function () {
          // seller purchase nft(tokenId_1) from creator, patent fee was set
          let tx = await exchange.connect(seller).matchOrder(buy_order_tmp, buy_order_sig_tmp, sell_order_tmp, sell_order_sig_tmp, { value: price })
          await tx.wait();

          buy_order_1.sellSideAsset.amountOrId = tokenId_1;
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          sell_order_1.sellSideAsset.amountOrId = tokenId_1;
          sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));

          originalBuyerBalance = await token.balanceOf(buyer.address);
          originalSellerBalance = await token.balanceOf(seller.address);
          originalRecipientBalance = await token.balanceOf(recipient.address);
          originalCreatorBalance = await token.balanceOf(creator.address);
          fee = await exchange.getFee();
          _fee = (ethers.BigNumber.from(buy_order_1.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(fee);
          royalty = await exchange.getRoyalty(buy_order_1.sellSideAsset.contractAddress, buy_order_1.sellSideAsset.amountOrId);
          _royalty = (ethers.BigNumber.from(buy_order_1.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();

          tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          await tx.wait()

        })
        it('owner of nft token changed', async function () {
          expect(await tokenProxy.ownerOf(tokenId_1)).to.equal(buyer.address);
        })
        it('buyer spends money', async function () {
          let currentBuyerBalance = await token.balanceOf(buyer.address);
          expect(originalBuyerBalance.sub(currentBuyerBalance)).to.equal(price)
        })
        it('seller receive money', async function () {
          let currentSellerBalance = await token.balanceOf(seller.address);
          expect(currentSellerBalance.sub(originalSellerBalance).add(_fee).add(_royalty)).to.equal(price)
        })
        it('recipient receive fee', async function () {
          let currentRecipientBalance = await token.balanceOf(recipient.address);
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_fee)
        })
        it('creator receive royalty', async function () {
          let currentCreatorBalance = await token.balanceOf(creator.address);
          expect(currentCreatorBalance.sub(originalCreatorBalance)).to.equal(_royalty)
        })
        it('both orders were flagged as finished', async function () {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_1))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_1))).to.equal(false);
        })
        it('four orders were flagged as finished via batch request', async function () {
          expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_1), hashOrder(sell_order_1), hashOrder(buy_order_tmp), hashOrder(sell_order_tmp)])).
            to.deep.equal([false, false, false, false]);
        })
      })

      context("with aution ERC20 orders executed: seller is creator", function () {
        beforeEach(async function () {
          originalBuyerBalance = await token.balanceOf(buyer.address);
          originalSellerBalance = await token.balanceOf(seller.address);
          originalRecipientBalance = await token.balanceOf(recipient.address);
          fee = await exchange.getFee();
          _fee = (ethers.BigNumber.from(buy_order_2.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(fee);
          royalty = await exchange.getRoyalty(buy_order_2.sellSideAsset.contractAddress, buy_order_2.sellSideAsset.amountOrId);
          _royalty = (ethers.BigNumber.from(buy_order_2.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();

          let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          await tx.wait();

        })
        it('owner of nft token changed', async function () {
          expect(await tokenProxy.ownerOf(tokenId_0)).to.equal(buyer.address);
        })
        it('buyer spends money', async function () {
          let currentBuyerBalance = await token.balanceOf(buyer.address);
          expect(originalBuyerBalance.sub(currentBuyerBalance)).to.equal(price);
        })
        it('seller receive money', async function () {
          let currentSellerBalance = await token.balanceOf(seller.address);
          expect(currentSellerBalance.sub(originalSellerBalance).add(_fee)).to.equal(price)
        })
        it('recipient receive fee', async function () {
          let currentRecipientBalance = await token.balanceOf(recipient.address);
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_fee)
        })
        it('both orders were flagged as finished', async function () {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_2))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_2))).to.equal(false);
        })
        it('both orders were flagged as finished via batch request', async function () {
          expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_2), hashOrder(sell_order_2)])).
            to.deep.equal([false, false]);
        })
      })

      context("with aution ERC20 orders executed: seller is not creator", function () {
        beforeEach(async function () {
          // seller purchase nft(tokenId_1) from creator, patent fee was set
          let tx = await exchange.connect(seller).matchOrder(buy_order_tmp, buy_order_sig_tmp, sell_order_tmp, sell_order_sig_tmp, { value: price })
          await tx.wait();

          buy_order_2.sellSideAsset.amountOrId = tokenId_1;
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          sell_order_2.sellSideAsset.amountOrId = tokenId_1;
          sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));

          originalBuyerBalance = await token.balanceOf(buyer.address);
          originalSellerBalance = await token.balanceOf(seller.address);
          originalRecipientBalance = await token.balanceOf(recipient.address);
          originalCreatorBalance = await token.balanceOf(creator.address);

          fee = await exchange.getFee();
          _fee = (ethers.BigNumber.from(buy_order_2.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(fee);
          royalty = await exchange.getRoyalty(buy_order_2.sellSideAsset.contractAddress, buy_order_2.sellSideAsset.amountOrId);
          _royalty = (ethers.BigNumber.from(buy_order_2.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();
          tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          await tx.wait()

        })
        it('owner of nft token changed', async function () {
          expect(await tokenProxy.ownerOf(tokenId_1)).to.equal(buyer.address);
        })
        it('buyer spends money', async function () {
          let currentBuyerBalance = await token.balanceOf(buyer.address);
          expect(originalBuyerBalance.sub(currentBuyerBalance)).to.equal(price)
        })
        it('seller receive money', async function () {
          let currentSellerBalance = await token.balanceOf(seller.address);
          expect(currentSellerBalance.sub(originalSellerBalance).add(_fee).add(_royalty)).to.equal(price)
        })
        it('recipient receive fee', async function () {
          let currentRecipientBalance = await token.balanceOf(recipient.address);
          expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_fee)
        })
        it('creator receive royalty', async function () {
          let currentCreatorBalance = await token.balanceOf(creator.address);
          expect(currentCreatorBalance.sub(originalCreatorBalance)).to.equal(_royalty)
        })
        it('both orders were flagged as finished', async function () {
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_2))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_2))).to.equal(false);
        })
        it('four orders were flagged as finished via batch request', async function () {
          expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_2), hashOrder(sell_order_2), hashOrder(buy_order_tmp), hashOrder(sell_order_tmp)])).
            to.deep.equal([false, false, false, false]);
        })
      })

      context('[event test] with non-aution ETH orders executed', function () {
        it('emit desired exchange event', async function () {
          let fee = await exchange.getFee();
          let royalty = await exchange.getRoyalty(buy_order_0.sellSideAsset.contractAddress, buy_order_0.sellSideAsset.amountOrId);
          let _fee = (ethers.BigNumber.from(buy_order_0.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(fee).toString();
          let _royalty = (ethers.BigNumber.from(buy_order_0.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();
          let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
          expect(tx).to.emit(exchange, 'OrderMatched')
            .withArgs(hashOrder(buy_order_0), hashOrder(sell_order_0), buyer.address, seller.address, tokenId_0, sell_order_0.isAuction, buy_order_0.buySideAsset.assetClass, buy_order_0.buySideAsset.contractAddress, buy_order_0.buySideAsset.amountOrId);
        })
        it('emit desired tokenProxy event', async function () {
          let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
          expect(tx).to.emit(tokenProxy, 'Transfer')
            .withArgs(seller.address, buyer.address, tokenId_0);
        })
        it('emit desired fee change event', async function () {
          let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
          expect(tx).to.emit(exchange, 'RoyaltyChanged')
            .withArgs(buy_order_0.sellSideAsset.contractAddress, tokenId_0, '0', ROYALTY);
        })
      })

      context('[event test] with non-aution ERC20 orders executed', function () {
        it('emit desired exchange event', async function () {
          let fee = await exchange.getFee();
          let royalty = await exchange.getRoyalty(buy_order_1.sellSideAsset.contractAddress, buy_order_1.sellSideAsset.amountOrId);
          let _fee = (ethers.BigNumber.from(buy_order_1.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(fee).toString();
          let _royalty = (ethers.BigNumber.from(buy_order_1.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();
          let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          expect(tx).to.emit(exchange, 'OrderMatched')
            .withArgs(hashOrder(buy_order_1), hashOrder(sell_order_1), buyer.address, seller.address, tokenId_0, sell_order_1.isAuction, buy_order_1.buySideAsset.assetClass, buy_order_1.buySideAsset.contractAddress, buy_order_1.buySideAsset.amountOrId);
        })
        it('emit desired tokenProxy event', async function () {
          let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          expect(tx).to.emit(tokenProxy, 'Transfer')
            .withArgs(seller.address, buyer.address, tokenId_0);
        })
        it('emit desired fee change event', async function () {
          let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          expect(tx).to.emit(exchange, 'RoyaltyChanged')
            .withArgs(buy_order_1.sellSideAsset.contractAddress, tokenId_0, '0', ROYALTY);
        })
      })

      context('[event test] with auction ERC20 orders executed', function () {
        it('emit desired exchange event', async function () {
          let fee = await exchange.getFee();
          let royalty = await exchange.getRoyalty(buy_order_2.sellSideAsset.contractAddress, buy_order_2.sellSideAsset.amountOrId);
          let _fee = (ethers.BigNumber.from(buy_order_2.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(fee).toString();
          let _royalty = (ethers.BigNumber.from(buy_order_2.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();
          let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          expect(tx).to.emit(exchange, 'OrderMatched')
            .withArgs(hashOrder(buy_order_2), hashOrder(sell_order_2), buyer.address, seller.address, tokenId_0, sell_order_2.isAuction, buy_order_2.buySideAsset.assetClass, buy_order_2.buySideAsset.contractAddress, buy_order_2.buySideAsset.amountOrId);
        })
        it('emit desired tokenProxy event', async function () {
          let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          expect(tx).to.emit(tokenProxy, 'Transfer')
            .withArgs(seller.address, buyer.address, tokenId_0);
        })
        it('emit desired fee change event', async function () {
          let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          expect(tx).to.emit(exchange, 'RoyaltyChanged')
            .withArgs(buy_order_2.sellSideAsset.contractAddress, tokenId_0, '0', ROYALTY);
        })
      })

    })

    context('with malicious order behaviors', function () {
      context('when buy order is modified', function () {
        it('revert with non-auction orders using ETH', async function () {
          try {
            buy_order_0.buySideAsset.amountOrId = '100000';
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder signature validation failed');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          try {
            buy_order_1.buySideAsset.amountOrId = '100000';
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder signature validation failed');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          try {
            buy_order_2.buySideAsset.amountOrId = '100000';
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder signature validation failed');
          }
        })
      })
      context('when sell order is modified', function () {
        it('revert with non-auction orders using ETH', async function () {
          try {
            sell_order_0.sellSideAsset.contractAddress = ZERO_ADDRESS;
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sellOrder signature validation failed');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          try {
            sell_order_1.sellSideAsset.contractAddress = ZERO_ADDRESS;
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sellOrder signature validation failed');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          try {
            sell_order_2.sellSideAsset.contractAddress = ZERO_ADDRESS;
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sellOrder signature validation failed');
          }
        })
      })


      context('when buy order exchange address does not match', function () {
        it('revert with non-auction orders using ETH', async function () {
          try {
            buy_order_0.exchange = ZERO_ADDRESS;
            buy_order_sig_0= await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          try {
            buy_order_1.exchange = ZERO_ADDRESS;
            buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          try {
            buy_order_2.exchange = ZERO_ADDRESS;
            buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
      })
      context('when sell order exchange address does not match', function () {
        it('revert with non-auction orders using ETH', async function () {
          try {
            sell_order_0.exchange = ZERO_ADDRESS;
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          try {
            sell_order_1.exchange = ZERO_ADDRESS;
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          try {
            sell_order_2.exchange = ZERO_ADDRESS;
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order does does not match exchange address');
          }
        })
      })
      context('when pair two buy orders', function () {
        it('revert with non-auction orders using ETH', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, buy_order_0, buy_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, buy_order_1, buy_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, buy_order_2, buy_order_sig_2, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
      })
      context('when pair two sell orders', function () {
        it('revert with non-auction orders using ETH', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(sell_order_0, sell_order_sig_1, buy_order_0, buy_order_sig_0, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
        it('revert with non-auction orders using ERc20', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(sell_order_1, sell_order_sig_1, buy_order_1, buy_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(sell_order_2, sell_order_sig_2, buy_order_2, buy_order_sig_2, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buy/sell side does not match');
          }
        })
      })
      context('when order transaction type does not match', function () {
        it('revert with non-auction orders using ETH', async function () {
          try {
            sell_order_0.isAuction = true;
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order transaction type does not match');
          }
        })
        it('revert with non-auction buy order pairs auction sell order using ERC20', async function () {
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_1, buy_order_sig_1, sell_order_2, sell_order_sig_2, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order transaction type does not match');
          }
        })
      })


      context('when order buySideAsset class does not match', function () {
        it('revert with non-auction buy order using ETH pairs non-acution sell order using ERC20', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_1, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order buySideAsset assetClass does not match');
          }
        })
      })
      context('when buy order bid price is less than sell order ask price ', function () {
        it('revert with non-auction orders using ETH', async function () {
          buy_order_0.buySideAsset.amountOrId = ethers.utils.parseEther('0.9').toString();
          buy_order_sig_0= await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder bid price must be no less than the seller ask price');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          buy_order_1.buySideAsset.amountOrId = ethers.utils.parseEther('0.9').toString();
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder bid price must be no less than the seller ask price');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          buy_order_2.buySideAsset.amountOrId = ethers.utils.parseEther('0.9').toString();
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('buyOrder bid price must be no less than the seller ask price');
          }
        })


      })
      context('when nft contract address does not match', function () {
        it('revert with non-auction orders using ETH', async function () {
          buy_order_0.sellSideAsset.contractAddress = ZERO_ADDRESS;
          buy_order_sig_0= await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order NFT contractAddress does not match');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          buy_order_1.sellSideAsset.contractAddress = ZERO_ADDRESS;
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order NFT contractAddress does not match');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          buy_order_2.sellSideAsset.contractAddress = ZERO_ADDRESS;
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order NFT contractAddress does not match');
          }
        })
      })
      context('when tokenID does not match', function () {
        it('revert with non-auction orders using ETH', async function () {
          buy_order_0.sellSideAsset.tokenId = tokenId_1;
          buy_order_sig_0= await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order tokenId does not match');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          buy_order_1.sellSideAsset.tokenId = tokenId_1;
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order tokenId does not match');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          buy_order_2.sellSideAsset.tokenId = tokenId_1;
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('order tokenId does not match');
          }
        })
      })
      context('when sell order start time has not reached yet', function () {
        it('revert with non-auction orders using ETH', async function () {
          sell_order_0.start = (await ethers.provider.getBlock('latest')).timestamp.toString() + 10;
          sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has not started');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          sell_order_1.start = (await ethers.provider.getBlock('latest')).timestamp.toString() + 10;
          sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has not started');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          sell_order_2.start = (await ethers.provider.getBlock('latest')).timestamp.toString() + 10;
          sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));

          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has not started');
          }
        })
      })
      context('when buy order has expired', function () {
        it('revert with non-auction orders using ETH', async function () {

          buy_order_0.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
          buy_order_sig_0= await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {


          buy_order_1.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          buy_order_2.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
      })
      context('when sell order has expired', function () {
        it('revert with non-auction orders using ETH', async function () {
          sell_order_0.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
          sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          sell_order_1.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
          sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          sell_order_2.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
          sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
      })
      context('when execute finished order', function () {
        it('revert with non-auction orders using ETH', async function () {
          let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          await tx.wait();
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
      })
      context('when execute cancelled buy order', function () {
        it('revert with non-auction orders using ETH', async function () {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order_0);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order_1);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order_2);
          await tx.wait();
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
      })
      context('when execute cancelled sell order', function () {
        it('revert with non-auction orders using ETH', async function () {
          let tx = await exchange.connect(seller).cancelOrder(sell_order_0);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with non-auction orders using ERC20', async function () {
          let tx = await exchange.connect(seller).cancelOrder(sell_order_1);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          let tx = await exchange.connect(seller).cancelOrder(sell_order_2);
          await tx.wait();
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
      })

      context('when match order is triggered by invalid user', function () {
        it('revert with non-auction orders using ETH: triggered by seller', async function () {
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('non-auction transaction must be executed by the buyer');
          }
        })
        it('revert with non-auction orders using ERC20: triggered by seller', async function () {
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('non-auction transaction must be executed by the buyer');
          }
        })
        it('revert with auction orders using ERC20: triggered by buyer', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('auction transaction must be executed by the seller');
          }
        })
      })

      context('with other malicious order behaviors', function () {
        it('revert with auction orders using ETH', async function () {
          try {
            buy_order_0.isAuction = true;
            buy_order_sig_0= await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
            sell_order_0.isAuction = true;
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            let tx = await exchange.connect(seller).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid orders: ETH not allowed in auction');
          }
        })
        it('revert with not paying enough ether in eth non-auction order', async function () {
          try {
            price = ethers.utils.parseEther('0.9').toString()
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ether amount does not match buy order amountOrId');
          }
        })
        it('revert with paying too much ether in eth non-auction order', async function () {
          try {
            price = ethers.utils.parseEther('1.1').toString()
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ether amount does not match buy order amountOrId');
          }
        })
        it('revert with not approving tokens in erc20 non-auction order', async function () {
          try {
            let tx = await token.connect(buyer).approve(exchange.address, '0');
            await tx;
            tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ERC20: transfer amount exceeds allowance');
          }
        })
        it('revert with not enough tokens in erc20 non-auction order', async function () {
          try {
            let tokenBalance = (await token.balanceOf(buyer.address)).toString();
            let tx = await token.connect(buyer).transfer(exchange.address, tokenBalance);
            await tx.wait();
            tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ERC20: transfer amount exceeds balance');
          }
        })
        it('revert with not approving tokens in erc20 auction order', async function () {
          try {
            let tx = await token.connect(buyer).approve(exchange.address, '0');
            await tx;
            tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ERC20: transfer amount exceeds allowance');
          }
        })
        it('revert with insufficient tokens in erc20 auction order', async function () {
          try {
            let tokenBalance = (await token.balanceOf(buyer.address)).toString();
            let tx = await token.connect(buyer).transfer(exchange.address, tokenBalance);
            await tx.wait();
            tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ERC20: transfer amount exceeds balance');
          }
        })
        it('revert with invalid assetClass in eth non-auction order', async function () {
          try {
            buy_order_0.buySideAsset.assetClass = '0x12345678';
            buy_order_sig_0= await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
            sell_order_0.buySideAsset.assetClass = '0x12345678';
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('unauthenticated asset type not allowed');
          }
        })
        it('revert with invalid assetClass in erc20 non-auction order', async function () {
          try {
            buy_order_1.buySideAsset.assetClass = '0x12345678';
            buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
            sell_order_1.buySideAsset.assetClass = '0x12345678';
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('unauthenticated asset type not allowed');
          }
        })
        it('revert with invalid assetClass in erc20 auction order', async function () {
          try {
            buy_order_2.buySideAsset.assetClass = '0x12345678';
            buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
            sell_order_2.buySideAsset.assetClass = '0x12345678';
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('unauthenticated asset type not allowed');
          }
        })
        it('revert with sending ethers in erc20 non-auction order', async function () {
          try {

            tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sending ether not allowed in ERC20 order');
          }
        })
        it('revert with sending ethers in erc20 auction order', async function () {
          try {

            tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sending ether not allowed in ERC20 order');
          }
        })
        it('revert with invalid royalty set in ETH non-auction order: royalty larger than 100%', async function () {
          try {
            let invalid_royalty = '10001';
            sell_order_0.sellSideAsset.royalty = invalid_royalty;
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid patent fee: total fee must no larger than 100%');
          }
        })
        it('revert with invalid royalty set in ERC20 non-auction order: royalty larger than 100%', async function () {
          try {
            let invalid_royalty = '10001';
            sell_order_1.sellSideAsset.royalty = invalid_royalty;
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid patent fee: total fee must no larger than 100%');
          }
        })
        it('revert with invalid royalty set in ERC20 auction order: royalty larger than 100%', async function () {
          try {
            let invalid_royalty = '10001';
            sell_order_2.sellSideAsset.royalty = invalid_royalty;
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid patent fee: total fee must no larger than 100%');
          }
        })
        it('revert with invalid patenFee set in ETH non-auction order: sum of royalty and platform fee is larger than 100% set in ERC20 non-auction order', async function () {
          try {
            let invalid_royalty = '9000';
            sell_order_0.sellSideAsset.royalty = invalid_royalty;
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid patent fee: total fee must no larger than 100%');
          }
        })
        it('revert with invalid patenFee set in ERC20 non-auction order: sum of royalty and platform fee is larger than 100% set in ERC20 non-auction order', async function () {
          try {
            let invalid_royalty = '9000';
            sell_order_1.sellSideAsset.royalty = invalid_royalty;
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid patent fee: total fee must no larger than 100%');
          }
        })
        it('revert with invalid patenFee set in ERC20 auction order: sum of royalty and platform fee is larger than 100% set in ERC20 non-auction order', async function () {
          try {
            let invalid_royalty = '9000';
            sell_order_2.sellSideAsset.royalty = invalid_royalty;
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid patent fee: total fee must no larger than 100%');
          }
        })
        it('revert with ETH non-auction order: platform fee set after patent fee, and sum of them is larger than 100%', async function () {
          try {
            // execute a transaction and set royalty to 10%
            tx = await exchange.connect(seller).matchOrder(buy_order_tmp, buy_order_sig_tmp, sell_order_tmp, sell_order_sig_tmp, { amountOrId: price });
            await tx.wait();
            // change platform fee to 95%
            tx = await exchange.connect(seller).changePlatformFee('9500');
            await tx.wait();
            buy_order_0.sellSideAsset.tokenId = tokenId_1;
            buy_order_sig_0= await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
            sell_order_0.sellSideAsset.tokenId = tokenId_1;
            sell_order_sig = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            // in this transaction, throw on failure as sum of fees are larger than 1005
            tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { amountOrId: price });
            await tx.wait()
            throw null;
          } catch (err) {
            expect(err.message).to.include('Transaction reverted');
          }
        })
        it('revert with ERC20 non-auction order: platform fee set after patent fee, and sum of them is larger than 100%', async function () {
          try {
            // execute a transaction and set royalty to 10%
            tx = await exchange.connect(seller).matchOrder(buy_order_tmp, buy_order_sig_tmp, sell_order_tmp, sell_order_sig_tmp, { amountOrId: price });
            await tx.wait();
            // change platform fee to 95%
            tx = await exchange.connect(seller).changePlatformFee('9500');
            await tx.wait();
            buy_order_1.sellSideAsset.tokenId = tokenId_1;
            buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
            sell_order_1.sellSideAsset.tokenId = tokenId_1;
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            // in this transaction, throw on failure as sum of fees are larger than 1005
            tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait()
            throw null;
          } catch (err) {
            expect(err.message).to.include('Arithmetic operation underflowed or overflowed outside of an unchecked block');
          }
        })
        it('revert with ERC20 auction order: platform fee set after patent fee, and sum of them is larger than 100%', async function () {
          try {
            // execute a transaction and set royalty to 10%
            tx = await exchange.connect(seller).matchOrder(buy_order_tmp, buy_order_sig_tmp, sell_order_tmp, sell_order_sig_tmp, { amountOrId: price });
            await tx.wait();
            // change platform fee to 95%
            tx = await exchange.connect(seller).changePlatformFee('9500');
            await tx.wait();
            buy_order_2.sellSideAsset.tokenId = tokenId_1;
            buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
            sell_order_2.sellSideAsset.tokenId = tokenId_1;
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            // in this transaction, throw on failure as sum of fees are larger than 1005
            tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait()
            throw null;
          } catch (err) {
            expect(err.message).to.include('Arithmetic operation underflowed or overflowed outside of an unchecked block');
          }
        })
      })

    })

    context('with legitimate user behaviors', function () {
      context('when user cancel owned orders', function () {
        it('buyer should cancel owned orders successfully', async function () {
          await exchange.connect(buyer).cancelOrder(buy_order_0);
          await exchange.connect(buyer).cancelOrder(buy_order_1);
          await exchange.connect(buyer).cancelOrder(buy_order_2);
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_0))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_1))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(buy_order_2))).to.equal(false);
        })
        it('seller should cancel owned orders successfully', async function () {
          await exchange.connect(seller).cancelOrder(sell_order_0);
          await exchange.connect(seller).cancelOrder(sell_order_1);
          await exchange.connect(seller).cancelOrder(sell_order_2);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_0))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_1))).to.equal(false);
          expect(await exchange.checkOrderStatus(hashOrder(sell_order_2))).to.equal(false);
        })
        it('[event test] emit desired cancel events when buyer cancel owned orders', async function () {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order_0);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(buy_order_0), buyer.address);
          tx = await exchange.connect(buyer).cancelOrder(buy_order_1);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(buy_order_1), buyer.address);
          tx = await exchange.connect(buyer).cancelOrder(buy_order_2);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(buy_order_2), buyer.address);
        })
        it('[event test] emit desired cancel events when seller cancel owned orders', async function () {
          let tx = await exchange.connect(seller).cancelOrder(sell_order_0);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(sell_order_0), seller.address);
          tx = await exchange.connect(seller).cancelOrder(sell_order_1);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(sell_order_1), seller.address);
          tx = await exchange.connect(seller).cancelOrder(sell_order_2);
          expect(tx).to.emit(exchange, 'OrderCancelled').withArgs(hashOrder(sell_order_2), seller.address);
        })
      })

    })

    context('with malicious user behaviors', function () {
      context('when user try to cancels other orders', function () {
        it('revert when others try to cancel seller orders', async function () {
          try {
            let tx = await exchange.connect(buyer).cancelOrder(sell_order_0);
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
        it('revert when others try to cancel buyer orders', async function () {
          try {
            let tx = await exchange.connect(seller).cancelOrder(buy_order_0);
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

    context('with legitimate admin behaviors', function () {
      context('when admin change platForm fee', function () {
        it('admin should change platForm fee successfully', async function () {
          let fee = '3000'
          let tx = await exchange.changePlatformFee(fee);
          await tx.wait();
          expect(await exchange.getFee()).to.equal(fee);
        })
        it('[event test] emit desired change fee event', async function () {
          let fee = '3000'
          let tx = await exchange.changePlatformFee(fee);
          expect(tx).to.emit(exchange, 'PlatformFeeChanged').withArgs(FEE, fee);
        })
      })
      context('when admin change recipient', function () {
        it('admin should change recipient fee successfully', async function () {
          let tx = await exchange.changeRecipient(newRecipient.address);
          await tx.wait();
          expect(await exchange.getRecipient()).to.equal(newRecipient.address);
        })
        it('[event test] emit desired change recipient event', async function () {
          let tx = await exchange.changeRecipient(newRecipient.address);
          expect(tx).to.emit(exchange, 'RecipientChanged').withArgs(recipient.address, newRecipient.address);
        })
      })
    })

    context('with malicious admin behaviors', function () {
      context('when admin change invalid platForm fee', function () {
        it('revert when fee larger than 100%', async function () {
          let fee = '10001';
          try {
            let tx = await exchange.changePlatformFee(fee);
            await tx.wait();
            throw null
          } catch (err) {
            expect(err.message).to.include("invalid platform fee: must no larger than 100%");
          }
        })
      })
      context('when admin change invalid recipient', function () {
        it('revert when set new recipient as zero address', async function () {
          try {
            let tx = await exchange.changeRecipient(ZERO_ADDRESS);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('zero address not allowed');
          }
        })
        it('revert when set new recipient as same address', async function () {
          try {
            let tx = await exchange.changeRecipient(recipient.address);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('same address not allowed');
          }
        })
      })
    })


  })


})

