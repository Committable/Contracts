const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const { projects, commits, tokenIds } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4, tokenId_5, tokenId_6, tokenId_7 } = tokenIds;
ROYALTY = '500'; // 5%
const life_span = 60 * 60 * 24 * 7 // one week
FEE = '1000' // 10%
PRICE = ethers.utils.parseEther('100').toString();
REPO_ROYALTY = ethers.utils.parseEther('2.5').toString(); // 100*5%*50%
const { Controller, ERC721Committable, Exchange, Vault, RoyaltyDistributor } = require("../utils/deployer.js");
DEADLINE = 0;
UINT256_MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
UINT256_ZERO = '0x00'



describe('Exchange', function () {
  context('with deployed contracts initialized orders and fees', function () {
    beforeEach(async function () {

      /* get signers */
      [seller, buyer, royaltyRecipient, recipient, newRecipient, dev, ...others] = await ethers.getSigners();

      provider = waffle.provider

      controller = await new Controller().deploy()
      tokenProxy = await new ERC721Committable().deploy(NAME, SYMBOL, seller.address, ZERO_ADDRESS, controller)
      exchange = await new Exchange(tokenProxy).deploy()
      vault = await new Vault().deploy(controller)
      royaltyDistributor = await new RoyaltyDistributor().deploy(tokenProxy, vault)
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
      tx = await royaltyDistributor.changeDevAddress(dev.address);
      await tx.wait()

      /**
       * Below we create multiple exchange.types of order pairs:
       * order_0: standard order pairs using ETH without royalty
       * order_1: standard order pairs using ETH with royalty
       * order_2: standard order pairs using ERC20 without royalty
       * order_3: standard order pairs using ERC20 with royalty
       * order_6: standard order pairs using ERC20 with royalty (Auction)
       * 
       * order_8: standard order pairs using ETH with royalty sent to royaltyDistributor
       * 
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
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first

      buy_order_sig_0 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_0);
      sell_order_sig_0 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_0);

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
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first

      buy_order_sig_1 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_1);
      sell_order_sig_1 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_1);
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
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_2 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_2);
      sell_order_sig_2 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_2);

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
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      buy_order_sig_3 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_3);
      sell_order_sig_3 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_3);


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
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }
      // hex string are treated as binary data anywhere except for signMessage, here must convert string to uint8Arrary(bytes array) first
      buy_order_sig_6 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_6);
      sell_order_sig_6 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_6);

      // 
      buy_order_8 = {
        isBuySide: true,
        isAuction: false,
        maker: buyer.address,
        paymentToken: ZERO_ADDRESS,
        value: PRICE,
        royaltyRecipient: royaltyDistributor.address,
        royalty: ROYALTY,
        target: tokenProxy.address,
        tokenId: tokenId_0,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }

      sell_order_8 = {
        isBuySide: false,
        isAuction: false,
        maker: seller.address,
        paymentToken: ZERO_ADDRESS,
        value: PRICE,
        royaltyRecipient: royaltyDistributor.address,
        royalty: ROYALTY,
        target: tokenProxy.address,
        tokenId: tokenId_0,
        start: 0,
        end: 0,
        salt: Math.floor(Math.random() * 10000)
      }

      buy_order_sig_8 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_8);
      sell_order_sig_8 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_8);

    })
    context('with legitimate behaviors', function () {
      context('with minted nft', function () {
        beforeEach('with minted nft', async function () {
          // sign some tokenId
          let signature_0 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_0
          });
          let signature_1 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_1
          });
          let signature_2 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_2
          });
          let signature_3 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_3
          });
          let signature_6 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_6
          });

          // // mint tokenId_0, 1, 2 to seller
          tx = await tokenProxy.mint(seller.address, tokenId_0, signature_0);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_1, signature_1);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_2, signature_2);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_3, signature_3);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_6, signature_6);
          await tx.wait();
          // deploy Helper for test


        })

        context("with ETH order: no royalty", function () {
          beforeEach(async function () {
            originalBuyerBalance = await buyer.getBalance();
            originalSellerBalance = await seller.getBalance();
            originalRecipientBalance = await recipient.getBalance();
            fee = await exchange.getFee();
            _fee = (ethers.BigNumber.from(buy_order_0.value)).div(ethers.BigNumber.from('10000')).mul(fee);
            royalty = buy_order_0.royalty;
            _royalty = (ethers.BigNumber.from(buy_order_0.value)).div(ethers.BigNumber.from('10000')).mul(royalty);

            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
            gasPrice = tx.gasPrice;
            gasUsed = (await tx.wait()).gasUsed;
            gasFee = gasPrice.mul(gasUsed);

          })
          it('owner of nft token changed', async function () {
            expect(await tokenProxy.ownerOf(tokenId_0)).to.equal(buyer.address);
          })
          it('buyer spends money', async function () {
            let currentBuyerBalance = await buyer.getBalance();
            expect(originalBuyerBalance.sub(currentBuyerBalance).sub(gasFee)).to.equal(PRICE)
          })
          it('seller receive money', async function () {
            let currentSellerBalance = await seller.getBalance();
            expect(currentSellerBalance.sub(originalSellerBalance).add(_fee).add(_royalty)).to.equal(PRICE)
          })
          it('recipient receive fee', async function () {
            let currentRecipientBalance = await recipient.getBalance();
            expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_fee)
          })
          it('both orders were flagged as finished', async function () {
            expect(await exchange.checkOrderStatus((buy_order_0))).to.equal(false);
            expect(await exchange.checkOrderStatus((sell_order_0))).to.equal(false);
          })

        })

        context("with ETH orders: have royalty", function () {
          beforeEach(async function () {

            originalBuyerBalance = await buyer.getBalance();
            originalSellerBalance = await seller.getBalance();
            originalRecipientBalance = await recipient.getBalance();
            originalRoyaltyRecipientBalance = await royaltyRecipient.getBalance();

            fee = await exchange.getFee();
            _fee = (ethers.BigNumber.from(buy_order_1.value)).div(ethers.BigNumber.from('10000')).mul(fee);
            royalty = buy_order_1.royalty;
            _royalty = (ethers.BigNumber.from(buy_order_1.value)).div(ethers.BigNumber.from('10000')).mul(royalty);

            tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: PRICE });
            gasPrice = tx.gasPrice;
            gasUsed = (await tx.wait()).gasUsed;
            gasFee = gasPrice.mul(gasUsed);

          })
          it('owner of nft token changed', async function () {
            expect(await tokenProxy.ownerOf(tokenId_1)).to.equal(buyer.address);
          })
          it('buyer spends money', async function () {
            let currentBuyerBalance = await buyer.getBalance();
            expect(originalBuyerBalance.sub(currentBuyerBalance).sub(gasFee)).to.equal(PRICE)
          })
          it('seller receive money', async function () {
            let currentSellerBalance = await seller.getBalance();
            expect(currentSellerBalance.sub(originalSellerBalance).add(_fee).add(_royalty)).to.equal(PRICE)
          })
          it('recipient receive fee', async function () {
            let currentRecipientBalance = await recipient.getBalance();
            expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_fee)
          })
          it('royaltyRecipient receive royalty', async function () {
            let currentRoyaltyRecipientBalance = await royaltyRecipient.getBalance();
            expect(currentRoyaltyRecipientBalance.sub(originalRoyaltyRecipientBalance)).to.equal(_royalty)
          })
          it('both orders were flagged as finished', async function () {
            expect(await exchange.checkOrderStatus((buy_order_1))).to.equal(false);
            expect(await exchange.checkOrderStatus((sell_order_1))).to.equal(false);
          })

        })

        context("with ERC20 orders: no royalty", function () {
          beforeEach(async function () {
            originalBuyerBalance = await token.balanceOf(buyer.address);
            originalSellerBalance = await token.balanceOf(seller.address);
            originalRecipientBalance = await token.balanceOf(recipient.address);
            fee = await exchange.getFee();
            _fee = (ethers.BigNumber.from(buy_order_2.value)).div(ethers.BigNumber.from('10000')).mul(fee);

            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
          })
          it('owner of nft token changed', async function () {
            expect(await tokenProxy.ownerOf(tokenId_2)).to.equal(buyer.address);
          })
          it('buyer spends moeny', async function () {
            let currentBuyerBalance = await token.balanceOf(buyer.address);
            expect(originalBuyerBalance.sub(currentBuyerBalance)).to.equal(PRICE);
          })
          it('seller receive money', async function () {
            let currentSellerBalance = await token.balanceOf(seller.address);
            expect(currentSellerBalance.sub(originalSellerBalance).add(_fee)).to.equal(PRICE)
          })
          it('recipient receive fee', async function () {
            let currentRecipientBalance = await token.balanceOf(recipient.address);
            expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_fee)
          })
          it('both orders were flagged as finished', async function () {
            expect(await exchange.checkOrderStatus((buy_order_2))).to.equal(false);
            expect(await exchange.checkOrderStatus((sell_order_2))).to.equal(false);
          })

        })

        context("with ERC20 orders: have royalty", function () {
          beforeEach(async function () {
            originalBuyerBalance = await token.balanceOf(buyer.address);
            originalSellerBalance = await token.balanceOf(seller.address);
            originalRecipientBalance = await token.balanceOf(recipient.address);
            originalRoyaltyRecipientBalance = await token.balanceOf(royaltyRecipient.address);
            fee = await exchange.getFee();
            _fee = (ethers.BigNumber.from(buy_order_3.value)).div(ethers.BigNumber.from('10000')).mul(fee);
            royalty = buy_order_3.royalty;
            _royalty = (ethers.BigNumber.from(buy_order_3.value)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();

            let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
            await tx.wait();
          })
          it('owner of nft token changed', async function () {
            expect(await tokenProxy.ownerOf(tokenId_3)).to.equal(buyer.address);
          })
          it('buyer spends money', async function () {
            let currentBuyerBalance = await token.balanceOf(buyer.address);
            expect(originalBuyerBalance.sub(currentBuyerBalance)).to.equal(PRICE)
          })
          it('seller receive money', async function () {
            let currentSellerBalance = await token.balanceOf(seller.address);
            expect(currentSellerBalance.sub(originalSellerBalance).add(_fee).add(_royalty)).to.equal(PRICE)
          })
          it('recipient receive fee', async function () {
            let currentRecipientBalance = await token.balanceOf(recipient.address);
            expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_fee)
          })
          it('royaltyRecipient receive royalty', async function () {
            let currentRoyaltyRecipientBalance = await token.balanceOf(royaltyRecipient.address);
            expect(currentRoyaltyRecipientBalance.sub(originalRoyaltyRecipientBalance)).to.equal(_royalty)
          })
          it('both orders were flagged as finished', async function () {
            expect(await exchange.checkOrderStatus((buy_order_3))).to.equal(false);
            expect(await exchange.checkOrderStatus((sell_order_3))).to.equal(false);
          })

        })

        context("with ERC20 orders: have royalty (auction)", function () {
          beforeEach(async function () {
            originalBuyerBalance = await token.balanceOf(buyer.address);
            originalSellerBalance = await token.balanceOf(seller.address);
            originalRecipientBalance = await token.balanceOf(recipient.address);
            originalRoyaltyRecipientBalance = await token.balanceOf(royaltyRecipient.address);
            fee = await exchange.getFee();
            _fee = (ethers.BigNumber.from(buy_order_6.value)).div(ethers.BigNumber.from('10000')).mul(fee);
            royalty = buy_order_6.royalty;
            _royalty = (ethers.BigNumber.from(buy_order_6.value)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();

            let tx = await exchange.connect(seller).matchOrder(buy_order_6, buy_order_sig_6, sell_order_6, sell_order_sig_6);
            await tx.wait();
          })
          it('owner of nft token changed', async function () {
            expect(await tokenProxy.ownerOf(tokenId_6)).to.equal(buyer.address);
          })
          it('buyer spends money', async function () {
            let currentBuyerBalance = await token.balanceOf(buyer.address);
            expect(originalBuyerBalance.sub(currentBuyerBalance)).to.equal(PRICE)
          })
          it('seller receive money', async function () {
            let currentSellerBalance = await token.balanceOf(seller.address);
            expect(currentSellerBalance.sub(originalSellerBalance).add(_fee).add(_royalty)).to.equal(PRICE)
          })
          it('recipient receive fee', async function () {
            let currentRecipientBalance = await token.balanceOf(recipient.address);
            expect(currentRecipientBalance.sub(originalRecipientBalance)).to.equal(_fee)
          })
          it('royaltyRecipient receive royalty', async function () {
            let currentRoyaltyRecipientBalance = await token.balanceOf(royaltyRecipient.address);
            expect(currentRoyaltyRecipientBalance.sub(originalRoyaltyRecipientBalance)).to.equal(_royalty)
          })
          it('both orders were flagged as finished', async function () {
            expect(await exchange.checkOrderStatus((buy_order_6))).to.equal(false);
            expect(await exchange.checkOrderStatus((sell_order_6))).to.equal(false);
          })

        })

        context('[event test] with ETH orders: no royalty', function () {
          it('emit desired exchange event', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
            await expect(tx).to.emit(exchange, 'OrderMatched')
              .withArgs(exchange.hashOrder(buy_order_0), exchange.hashOrder(sell_order_0), buyer.address, seller.address, buy_order_0.paymentToken, buy_order_0.value, sell_order_0.royalty, sell_order_0.royaltyRecipient);
          })
          it('emit desired committable event', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
            await expect(tx).to.emit(tokenProxy, 'Transfer')
              .withArgs(seller.address, buyer.address, tokenId_0);
          })
        })

        context('[event test] with ETH orders: have royalty', function () {
          it('emit desired exchange event', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: PRICE });
            await expect(tx).to.emit(exchange, 'OrderMatched')
              .withArgs(exchange.hashOrder(buy_order_1), exchange.hashOrder(sell_order_1), buyer.address, seller.address, buy_order_1.paymentToken, buy_order_1.value, sell_order_1.royalty, sell_order_1.royaltyRecipient);
          })
          it('emit desired committable event', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: PRICE });
            await expect(tx).to.emit(tokenProxy, 'Transfer')
              .withArgs(seller.address, buyer.address, tokenId_1);
          })

        })

        context('[event test] with ERC20 orders: no royalty', function () {
          it('emit desired exchange event', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await expect(tx).to.emit(exchange, 'OrderMatched')
              .withArgs(exchange.hashOrder(buy_order_2), exchange.hashOrder(sell_order_2), buyer.address, seller.address, buy_order_2.paymentToken, buy_order_2.value, sell_order_2.royalty, sell_order_2.royaltyRecipient);
          })
          it('emit desired committable event', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await expect(tx).to.emit(tokenProxy, 'Transfer')
              .withArgs(seller.address, buyer.address, tokenId_2);
          })
          it('emit desired token transfer event', async function () {
            let fee = await exchange.getFee();
            let feeRecipient = await exchange.getRecipient();
            // let royaltyRecipient = buy_order_2.royaltyRecipient;
            // let royalty = buy_order_2.royalty;
            let _fee = (ethers.BigNumber.from(buy_order_2.value)).div(ethers.BigNumber.from('10000')).mul(fee);
            // let _royalty = (ethers.BigNumber.from(buy_order_2.value)).div(ethers.BigNumber.from('10000')).mul(royalty);
            let _pay = (ethers.BigNumber.from(buy_order_2.value).sub(_fee));
            // let _pay = (ethers.BigNumber.from(buy_order_2.value).sub(_fee).sub(_royalty));


            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await expect(tx).to.emit(token, 'Transfer')
              .withArgs(buyer.address, seller.address, _pay.toString());
            await expect(tx).to.emit(token, 'Transfer')
              .withArgs(buyer.address, feeRecipient, _fee.toString());
            // expect(tx).to.emit(token, 'Transfer')
            //     .withArgs(buyer.address, royaltyRecipient.address, _royalty.toString());
          })
        })
        context('[event test] with ERC20 orders: have royalty', function () {
          it('emit desired exchange event', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
            await expect(tx).to.emit(exchange, 'OrderMatched')
              .withArgs(exchange.hashOrder(buy_order_3), exchange.hashOrder(sell_order_3), buyer.address, seller.address, buy_order_3.paymentToken, buy_order_3.value, sell_order_3.royalty, sell_order_3.royaltyRecipient);
          })
          it('emit desired committable event', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
            await expect(tx).to.emit(tokenProxy, 'Transfer')
              .withArgs(seller.address, buyer.address, tokenId_3);
          })
          it('emit desired token transfer event', async function () {
            let fee = await exchange.getFee();
            let feeRecipient = await exchange.getRecipient();
            let royaltyRecipient = buy_order_3.royaltyRecipient;
            let royalty = buy_order_3.royalty;
            let _fee = (ethers.BigNumber.from(buy_order_3.value)).div(ethers.BigNumber.from('10000')).mul(fee);
            let _royalty = (ethers.BigNumber.from(buy_order_3.value)).div(ethers.BigNumber.from('10000')).mul(royalty);
            let _pay = (ethers.BigNumber.from(buy_order_3.value).sub(_fee).sub(_royalty));

            let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
            await expect(tx).to.emit(token, 'Transfer')
              .withArgs(buyer.address, seller.address, _pay.toString());
            await expect(tx).to.emit(token, 'Transfer')
              .withArgs(buyer.address, feeRecipient, _fee.toString());
            await expect(tx).to.emit(token, 'Transfer')
              .withArgs(buyer.address, royaltyRecipient, _royalty.toString());
          })
        })

      })
      context('other behaviors', function () {
        it('should cancel order correctly', async function () {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order_0);
          await tx.wait();
          expect(await exchange.checkOrderStatus((buy_order_0))).to.equal(false);
        })
        it('[EVENT] cancel order', async function () {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order_0);
          expect(tx).to.emit(exchange, 'OrderCancelled')
            .withArgs((buy_order_0), buy_order_0.maker);
        })


      })


    })
    context('with malicious order behaviors', function () {
      context('with standard orders', function () {
        beforeEach('with minted nft', async function () {
          // sign some tokenId
          let signature_0 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_0
          });
          let signature_1 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_1
          });
          let signature_2 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_2
          });
          let signature_3 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_3
          });
          let signature_6 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_6
          });


          // mint tokenId_0, 1, 2 to seller
          tx = await tokenProxy.mint(seller.address, tokenId_0, signature_0);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_1, signature_1);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_2, signature_2);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_3, signature_3);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_6, signature_6);
          await tx.wait();
        })
        context('when buy order value is modified', function () {

          it('revert with ETH order', async function () {
            try {
              buy_order_0.value = '100000';
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_1, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
          it('revert with ERC20 order', async function () {
            try {
              buy_order_2.value = '100000';
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
        })
        context('when sell order paymentToken is modified', function () {
          it('revert with ETH standard orders', async function () {
            try {
              let anotherPaymentToken = '0x92E0a5c7d7D806cD48Db15e220DC4440185b0787'
              sell_order_0.paymentToken = anotherPaymentToken;
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
          it('revert with ERC20 standard orders ', async function () {
            try {
              let anotherPaymentToken = '0x92E0a5c7d7D806cD48Db15e220DC4440185b0787'
              sell_order_2.paymentToken = anotherPaymentToken;
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })

        })
        context('when called by unexpected user', function () {
          it('revert when operator not registerred', async function () {
            let tx = await tokenProxy.registerOperator(exchange.address, false)
            await tx.wait()
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('ERC721: transfer caller is not owner nor approved');
            }
          })
       
          it('revert with buyer call erc20 standard order', async function () {
            try {
              await exchange.connect(buyer).matchOrder(buy_order_6, buy_order_sig_6, sell_order_6, sell_order_sig_6);
              throw null;
            } catch (err) {
              expect(err.message).to.include("must be called by legit user")
            }
          })
      
        })
        context('when buy order exchange address does not match', function () {
          it('revert with ETH standard orders', async function () {
            try {
              exchange.domain.verifyingContract = ZERO_ADDRESS;
              buy_order_sig_0 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_0);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
          it('revert with ERC20 standard orders', async function () {
            try {
              exchange.domain.verifyingContract = ZERO_ADDRESS;
              buy_order_sig_3 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_3);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
         
        

        })
        context('when sell order exchange address does not match', function () {
          it('revert with ETH standard orders', async function () {
            try {
              exchange.domain.verifyingContract = ZERO_ADDRESS;
              sell_order_sig_0 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_0);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
          it('revert with ERC20 standard orders', async function () {
            try {
              exchange.domain.verifyingContract = ZERO_ADDRESS;
              sell_order_sig_3 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_3);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
     
        })
        context('when pair two buy orders', function () {
          it('revert with ETH standard orders', async function () {
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, buy_order_0, buy_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 standard orders', async function () {
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, buy_order_2, buy_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
    
        })
        context('when pair two sell orders', function () {
          it('revert with ETH standard orders', async function () {
            try {
              let tx = await exchange.connect(buyer).matchOrder(sell_order_0, sell_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 standard orders', async function () {
            try {
              let tx = await exchange.connect(buyer).matchOrder(sell_order_2, sell_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
        
  
        })

        context('when order payment token does not match', function () {
          it('revert with buy_order_0 pairs sell_order_2', async function () {
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_2, sell_order_sig_2, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
        })
        context('when buy order bid price is less than sell order ask price ', function () {
          it('revert with ETH standard order', async function () {
            buy_order_0.value = ethers.utils.parseEther('0.9').toString();
            buy_order_sig_0 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_0);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: buy_order_0.value });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 standard order', async function () {
            buy_order_2.value = ethers.utils.parseEther('0.9').toString();
            buy_order_sig_2 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_2);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
         
    
        })
        context('when nft contract address does not match', function () {
          it('revert with ETH standard order', async function () {
            buy_order_0.target = ZERO_ADDRESS;
            buy_order_sig_0 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_0);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include("invalid order parameters");
            }
          })
          it('revert with ERC20 standard order', async function () {
            buy_order_2.target = ZERO_ADDRESS;
            buy_order_sig_2 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_2);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
      
       
        })
        context('when tokenID does not match', function () {
          it('revert with ETH standard order', async function () {
            buy_order_0.tokenId = tokenId_1;
            buy_order_sig_0 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_0);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 standard order', async function () {
            buy_order_2.tokenId = tokenId_0;
            buy_order_sig_2 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_2);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
       
         
        })
        context('when buy order start time has not reached yet', function () {
          it('revert with ETH standard order', async function () {
            buy_order_0.start = Date.now() * 10;
            buy_order_sig_0 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_0);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: buy_order_0.value });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 standard order', async function () {
            buy_order_2.start = Date.now() * 10;
            buy_order_sig_2 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_2);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
       
       
        })
        context('when buy order has expired', function () {
          it('revert with ETH standard order', async function () {
            buy_order_0.end = 1;
            buy_order_sig_0 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_0);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: buy_order_0.value });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 standard order', async function () {
            buy_order_2.end = 1;
            buy_order_sig_2 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_2);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
       
       
        })
        context('when sell order has expired', function () {
          it('revert with ETH standard order', async function () {
            sell_order_0.end = 1;
            sell_order_sig_0 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_0);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: buy_order_0.value });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 standard order', async function () {
            sell_order_2.end = 1;
            sell_order_sig_2 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_2);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
    
        })
        context('when execute finished order', function () {
          it('revert with ETH standard order', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
            await tx.wait();
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 standard order', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
      
        })
        context('when execute cancelled buy order', function () {
          it('revert with ETH order', async function () {
            let tx = await exchange.connect(buyer).cancelOrder(buy_order_0);
            await tx.wait();
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })

          it('revert with ERC20 standard order', async function () {
            let tx = await exchange.connect(buyer).cancelOrder(buy_order_2);
            await tx.wait();
            try {
              let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
        
         
        })
        context('when execute cancelled sell order', function () {
          it('revert with ETH order', async function () {
            let tx = await exchange.connect(seller).cancelOrder(sell_order_0);
            await tx.wait();
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })

          it('revert with ERC20 standard order', async function () {
            let tx = await exchange.connect(seller).cancelOrder(sell_order_2);
            await tx.wait();
            try {
              let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          
         
        })

        context('with other malicious order behaviors', function () {
          it('revert with ERC20 orders using ETH', async function () {
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid payment');
            }
          })
          it('revert with not paying enough ether in eth non-auction order', async function () {
            try {
              price = ethers.utils.parseEther('0.9').toString()
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid payment');
            }
          })
          it('revert with paying too much ether in eth order', async function () {
            try {
              price = ethers.utils.parseEther('1.1').toString()
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid payment');
            }
          })
          it('revert with not approving tokens in ERC20 order', async function () {
            try {
              let tx = await token.connect(buyer).approve(exchange.address, '0');
              await tx;
              tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('ERC20: insufficient allowance');
            }
          })
          it('revert with not enough tokens in ERC20 order', async function () {
            try {
              let tokenBalance = (await token.balanceOf(buyer.address)).toString();
              let tx = await token.connect(buyer).transfer(exchange.address, tokenBalance);
              await tx.wait();
              tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('ERC20: transfer amount exceeds balance');
            }
          })
          it('revert with sending ethers in erc20 order', async function () {
            try {
              tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid payment');
            }
          })

          it('revert with sending ethers from seller in ERC20 order', async function () {
            try {
              tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid payment');
            }
          })
          it('revert with invalid royalty set in ETH order: royalty larger than 100%', async function () {
            try {
              buy_order_1.royalty = 10001;
              sell_order_1.royalty = 10001;
              buy_order_sig_1 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_1);
              sell_order_sig_1 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_1);


              tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with invalid royalty set in ERC20 order: royalty larger than 100%', async function () {
            try {
              buy_order_3.royalty = 10001;
              sell_order_3.royalty = 10001;
              buy_order_sig_3 = await buyer._signTypedData(exchange.domain, exchange.types, buy_order_3);
              sell_order_sig_3 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_3);
              tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })

          it('revert with invalid fee', async function () {
            try {
              let newFee = 9500;
              tx = await exchange.changeFee(newFee);
              await tx.wait()


              throw null;
            } catch (err) {
              expect(err.message).to.include('Exchange: fee must no larger than 10%');
            }
          })
          it('revert with invalid royalty', async function () {
            try {
              let newRoyalty = 2000;
              sell_order_0.royalty = newRoyalty
              sell_order_sig_0 = await seller._signTypedData(exchange.domain, exchange.types, sell_order_0);

              tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
        })
        context('when seller does not own the token', function () {
          it('revert when the seller does not own the token', async function () {
            let tx = await tokenProxy.transferFrom(seller.address, recipient.address, tokenId_0);
            await tx.wait();

            try {
              tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait()
              throw null;
            } catch (err) {
              expect(err.message).to.include('ERC721: transfer from incorrect owner');
            }
          })
        })

      })
      context('other behaviors', function () {
        it('should revert with invalid user', async function () {
          try {
            let tx = await exchange.connect(seller).cancelOrder(buy_order_0);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid request');
          }
        })
        it('should revert with cancelled order', async function () {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order_0);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).cancelOrder(buy_order_0);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid request');
          }
        })
        it('should revert when buyer trys to execute auction orders', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_6, buy_order_sig_6, sell_order_6, sell_order_sig_6);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('must be called by legit user');
          }
        })
        it('should revert when seller trys to execute standard orders', async function () {
          try {
            let tx = await exchange.connect(seller).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('must be called by legit user');
          }
        })
        it('should revert when exchange not registered', async function () {
          let tx =await tokenProxy.registerOperator(exchange.address, false)
          await tx.wait()
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
            await tx.wait();
            throw null;
          }catch(err) {
            expect(err.message).to.include("ERC721: operator query for nonexistent token")
          }
        })
      })
    })

    context("with royalty sent to contract", function () {
      // generate order pairs: pay eth to transfer erc721, no royalty
      beforeEach('with minted nft', async function () {
           // sign some tokenId
           let signature_0 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_0
          });
          let signature_1 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_1
          });
          let signature_2 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_2
          });
          let signature_3 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_3
          });
          let signature_6 = await seller._signTypedData(tokenProxy.domain, tokenProxy.types, {
            creator: seller.address,
            tokenId: tokenId_6
          });

          // // mint tokenId_0, 1, 2 to seller
          tx = await tokenProxy.mint(seller.address, tokenId_0, signature_0);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_1, signature_1);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_2, signature_2);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_3, signature_3);
          await tx.wait();
          tx = await tokenProxy.mint(seller.address, tokenId_6, signature_6);
          await tx.wait();

      })
      it("should controller get royaltyDistributor address", async function () {
        expect(await tokenProxy.royaltyDistributor()).to.equal(royaltyDistributor.address)

      })
      it("should royaltyDistributor record correct erc721committable", async function () {
        expect(await royaltyDistributor.committableERC721()).to.equal(tokenProxy.address)
        expect(await royaltyDistributor.vaultAddress()).to.equal(vault.address)


      })

      it("should distribute royalty to vault", async function () {
        let tx = await exchange.connect(buyer).matchOrder(buy_order_8, buy_order_sig_8, sell_order_8, sell_order_sig_8, { value: PRICE });
        await tx.wait()
        // distribute royalty in next tx
        tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2)
        // value change
        await expect(tx).to.changeEtherBalance(vault, REPO_ROYALTY)
        await expect(tx).to.changeEtherBalance(dev, REPO_ROYALTY)

        // state change
        expect(await vault.reserve(projects.project_a, ZERO_ADDRESS)).to.equal(REPO_ROYALTY)
        // emit event
        await expect(tx).to.emit(vault, 'Deposit')
          .withArgs(projects.project_a, ZERO_ADDRESS, REPO_ROYALTY);
      })



    })
  })
})