const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;
const { Order, hashOrder, encodeTransferWithPermit, encodeMintWithSig } = require("./utils.js");
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4, tokenId_5 } = tokenIds;
const ETH_CLASS = '0xaaaebeba';
const ERC20_CLASS = '0x8ae85d84';
const ERC721_CLASS = '0x73ad2146';
const ROYALTY = 1000; // 10 %
const life_span = 60 * 60 * 24 * 7 // one week


function shouldRevertWithMaliciousBehavior() {

  context('with malicious order behaviors', function () {
    context.only('with standard orders and lazy-mint orders', function () {
      beforeEach('with minted nft', async function () {
          // sign some tokenId
          let abiCoder = new ethers.utils.AbiCoder();
          let signature_0 = await seller.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_0])));
          let signature_1 = await seller.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_1])));
          let signature_2 = await seller.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_2])));
          let signature_3 = await seller.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_3])));

          // mint tokenId_0, 1, 2 to seller
          tx = await committable.mint(seller.address, tokenId_0, signature_0);
          await tx.wait();
          tx = await committable.mint(seller.address, tokenId_1, signature_1);
          await tx.wait();
          tx = await committable.mint(seller.address, tokenId_2, signature_2);
          await tx.wait();
          tx = await committable.mint(seller.address, tokenId_3, signature_3);
          await tx.wait();
      })
      context.only('when buy order value is modified', function () {
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
        it('revert with ETH lazy-mint order', async function () {
          try {
            buy_order_4.value = '100000';
            let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order signature');
          }
        })
        it('revert with ERC20 lazy-mint order', async function () {
          try {
            buy_order_5.value = '100000';
            let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order signature');
          }
        })
      })
      context.only('when sell order paymentToken is modified', function () {
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
        it('revert with ERC20 lazy-mint orders ', async function () {
          try {
            let anotherPaymentToken = '0x92E0a5c7d7D806cD48Db15e220DC4440185b0787'
            sell_order_4.paymentToken = anotherPaymentToken;
            let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order signature');
          }
        })
        it('revert with ERC20 lazy-mint orders ', async function () {
          try {
            let anotherPaymentToken = '0x92E0a5c7d7D806cD48Db15e220DC4440185b0787'
            sell_order_5.paymentToken = anotherPaymentToken;
            let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order signature');
          }
        })
      })

      context.only('when buy order exchange address does not match', function () {
        it('revert with ETH standard orders', async function () {
          try {
            buy_order_0.exchange = ZERO_ADDRESS;
            buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
        it('revert with ERC20 standard orders', async function () {
          try {
            buy_order_3.exchange = ZERO_ADDRESS;
            buy_order_sig_3 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_3)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
        it('revert with ETH lazy-mint orders', async function () {
          try {
            buy_order_4.exchange = ZERO_ADDRESS;
            buy_order_sig_4 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_4)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
        it('revert with ERC20 lazy-mint orders', async function () {
          try {
            buy_order_5.exchange = ZERO_ADDRESS;
            buy_order_sig_5 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_5)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
   
      })
      context.only('when sell order exchange address does not match', function () {
        it('revert with ETH standard orders', async function () {
          try {
            sell_order_0.exchange = ZERO_ADDRESS;
            sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
        it('revert with ERC20 standard orders', async function () {
          try {
            sell_order_3.exchange = ZERO_ADDRESS;
            sell_order_sig_3 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_3)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })      
        it('revert with ETH lazy-mint orders', async function () {
          try {
            sell_order_4.exchange = ZERO_ADDRESS;
            sell_order_sig_4 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_4)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
        it('revert with ERC20 standard orders', async function () {
          try {
            sell_order_5.exchange = ZERO_ADDRESS;
            sell_order_sig_5 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_5)));
            let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })   
      })
      context.only('when pair two buy orders', function () {
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
        it('revert with ETH lazy-mint orders', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, buy_order_4, buy_order_sig_4, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
        it('revert with ERC20 lazy-mint orders', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, buy_order_5, buy_order_sig_5, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
      })
      context.only('when pair two sell orders', function () {
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
        it('revert with ETH lazy-mint orders', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(sell_order_4, sell_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
        it('revert with ERC20 lazy-mint orders', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(sell_order_5, sell_order_sig_5, sell_order_5, sell_order_sig_5, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
      })

      context.only('when order payment token does not match', function () {
        it('revert with buy_order_0 pairs sell_order_2', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_2, sell_order_sig_2, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
        it('revert with buy_order_4 pairs sell_order_5', async function () {
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_5, sell_order_sig_5, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
      })
      context.only('when buy order bid price is less than sell order ask price ', function () {
        it('revert with ETH standard order', async function () {
          buy_order_0.value = ethers.utils.parseEther('0.9').toString();
          buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
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
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
        it('revert with ETH lazy-mint order', async function () {
          buy_order_4.value = ethers.utils.parseEther('0.9').toString();
          buy_order_sig_4 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_4)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: buy_order_4.value });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
        it('revert with ERC20 lazy-mint order', async function () {
          buy_order_5.value = ethers.utils.parseEther('0.9').toString();
          buy_order_sig_5 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_5)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5, { value: buy_order_5.value });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid order parameters');
          }
        })
      })
      context.only('when nft contract address does not match', function () {
        it('revert with ETH standard order', async function () {
          let calldata = encodeTransferWithPermit(ZERO_ADDRESS, ZERO_ADDRESS, buyer.address, tokenId_0)
          buy_order_0.data = calldata;
          buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid data replacement');
          }
        })
        it('revert with ERC20 standard order', async function () {
          let calldata = encodeTransferWithPermit(ZERO_ADDRESS, ZERO_ADDRESS, buyer.address, tokenId_2)
          buy_order_2.data = calldata;
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid data replacement');
          }
        })
        it('revert with ETH lazy-mint order', async function () {
          let calldata = encodeMintWithSig(ZERO_ADDRESS, buyer.address, tokenId_4)
          buy_order_4.data = calldata;
          buy_order_sig_4 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_4)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid data replacement');
          }
        })
        it('revert with ETH standard order', async function () {
          let calldata = encodeMintWithSig(ZERO_ADDRESS, buyer.address, tokenId_5)
          buy_order_5.data = calldata;
          buy_order_sig_5 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_5)));
          try {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid data replacement');
          }
        })
      })
      context('when tokenID does not match', function () {
        it('revert with ETH order', async function () {
          buy_order_0.sellSideAsset.value = tokenId_1;
          buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sellSideAsset value does not match');
          }
        })
        it('revert with ERC20 order', async function () {
          buy_order_1.sellSideAsset.value = tokenId_0;
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sellSideAsset value does not match');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          buy_order_2.sellSideAsset.value = tokenId_0;
          buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
          try {
            let tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sellSideAsset value does not match');
          }
        })
      })
      context('when sell order start time has not reached yet', function () {
        it('revert with ETH order', async function () {
          sell_order_0.start = (await ethers.provider.getBlock('latest')).timestamp.toString() + 10;
          sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has not started');
          }
        })
        it('revert with ERC20 order', async function () {
          sell_order_1.start = (await ethers.provider.getBlock('latest')).timestamp.toString() + 10;
          sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
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
            let tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has not started');
          }
        })
      })
      context('when buy order has expired', function () {
        it('revert with ETH order', async function () {

          buy_order_0.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
          buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
        it('revert with ERC20 order', async function () {
          buy_order_1.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
          buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
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
            let tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
      })
      context('when sell order has expired', function () {
        it('revert with ETH order', async function () {
          sell_order_0.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
          sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
        it('revert with ERC20 order', async function () {
          sell_order_1.end = (await ethers.provider.getBlock('latest')).timestamp.toString();
          sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
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
            let tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has expired');
          }
        })
      })
      context('when execute finished order', function () {
        it('revert with ETH order', async function () {
          let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with ERC20 order', async function () {
          let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with auction orders using ERC20', async function () {
          let tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
          await tx.wait();
          try {
            let tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
      })
      context('when execute cancelled buy order', function () {
        it('revert with ETH order', async function () {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order_0);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with ERC20 order', async function () {
          let tx = await exchange.connect(buyer).cancelOrder(buy_order_1);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
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
            let tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
      })
      context('when execute cancelled sell order', function () {
        it('revert with ETH order', async function () {
          let tx = await exchange.connect(seller).cancelOrder(sell_order_0);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
        it('revert with ERC20 order', async function () {
          let tx = await exchange.connect(seller).cancelOrder(sell_order_1);
          await tx.wait();
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
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
            let tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('either order has been cancelled or finishd');
          }
        })
      })

      context('when match order is triggered by invalid user', function () {
        it('revert with ETH order: triggered by seller', async function () {
          try {
            let tx = await exchange.connect(seller).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('fixed-price transaction must be executed by the buyer');
          }
        })
        it('revert with ERC20 order: triggered by seller', async function () {
          try {
            let tx = await exchange.connect(seller).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('fixed-price transaction must be executed by the buyer');
          }
        })
        it('revert with auction orders using ERC20: triggered by buyer', async function () {
          try {
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
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
            buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
            sell_order_0.isAuction = true;
            sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            let tx = await exchange.connect(seller).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid orders: ETH not allowed in auction');
          }
        })
        it('revert with not paying enough ether in eth non-auction order', async function () {
          try {
            price = ethers.utils.parseEther('0.9').toString()
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ether amount does not match buy order value');
          }
        })
        it('revert with paying too much ether in eth non-auction order', async function () {
          try {
            price = ethers.utils.parseEther('1.1').toString()
            let tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ether amount does not match buy order value');
          }
        })
        it('revert with not approving tokens in erc20 non-auction order', async function () {
          try {
            let tx = await token.connect(buyer).approve(exchange.address, '0');
            await tx;
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
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
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
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
            tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
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
            tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('ERC20: transfer amount exceeds balance');
          }
        })
        it('revert with invalid buySideAsset assetClass in eth non-auction order', async function () {
          try {
            buy_order_0.buySideAsset.assetClass = '0x12345678';
            buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
            sell_order_0.buySideAsset.assetClass = '0x12345678';
            sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid buySideAsset type');
          }
        })
        it('revert with invalid buySideAsset assetClass in erc20 non-auction order', async function () {
          try {
            buy_order_1.buySideAsset.assetClass = '0x12345678';
            buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
            sell_order_1.buySideAsset.assetClass = '0x12345678';
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid buySideAsset type');
          }
        })
        it('revert with invalid buySideAsset assetClass in erc20 auction order', async function () {
          try {
            buy_order_2.buySideAsset.assetClass = '0x12345678';
            buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
            sell_order_2.buySideAsset.assetClass = '0x12345678';
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid buySideAsset type');
          }
        })
        it('revert with invalid sellSideAsset assetClass in eth non-auction order', async function () {
          try {
            buy_order_0.sellSideAsset.assetClass = '0x12345678';
            buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
            sell_order_0.sellSideAsset.assetClass = '0x12345678';
            sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid sellSideAsset type');
          }
        })
        it('revert with invalid sellSideAsset assetClass in erc20 non-auction order', async function () {
          try {
            buy_order_1.sellSideAsset.assetClass = '0x12345678';
            buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
            sell_order_1.sellSideAsset.assetClass = '0x12345678';
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid sellSideAsset type');
          }
        })
        it('revert with invalid sellSideAsset assetClass in erc20 auction order', async function () {
          try {
            buy_order_2.sellSideAsset.assetClass = '0x12345678';
            buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
            sell_order_2.sellSideAsset.assetClass = '0x12345678';
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid sellSideAsset type');
          }
        })
        it('revert with sending ethers in erc20 non-auction order', async function () {
          try {

            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sending ether not allowed in ERC20 order');
          }
        })
        it('revert with sending ethers in erc20 auction order', async function () {
          try {

            tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('sending ether not allowed in ERC20 order');
          }
        })
        it('revert with invalid royalty set in ETH non-auction order: royalty larger than 100%', async function () {
          try {
            let invalid_royalty = '10001';
            sell_order_0.royalty = invalid_royalty;
            sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid royalty: sum of fee and royalty must no larger than 100%');
          }
        })
        it('revert with invalid royalty set in ERC20 non-auction order: royalty larger than 100%', async function () {
          try {
            let invalid_royalty = '10001';
            sell_order_1.royalty = invalid_royalty;
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid royalty: sum of fee and royalty must no larger than 100%');
          }
        })
        it('revert with invalid royalty set in ERC20 auction order: royalty larger than 100%', async function () {
          try {
            let invalid_royalty = '10001';
            sell_order_2.royalty = invalid_royalty;
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid royalty: sum of fee and royalty must no larger than 100%');
          }
        })
        it('revert with invalid patenFee set in ETH non-auction order: sum of royalty and platform fee is larger than 100% set in ERC20 non-auction order', async function () {
          try {
            let invalid_royalty = '9000';
            sell_order_0.royalty = invalid_royalty;
            sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid royalty: sum of fee and royalty must no larger than 100%');
          }
        })
        it('revert with invalid patenFee set in ERC20 non-auction order: sum of royalty and platform fee is larger than 100% set in ERC20 non-auction order', async function () {
          try {
            let invalid_royalty = '9000';
            sell_order_1.royalty = invalid_royalty;
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid royalty: sum of fee and royalty must no larger than 100%');
          }
        })
        it('revert with invalid patenFee set in ERC20 auction order: sum of royalty and platform fee is larger than 100% set in ERC20 non-auction order', async function () {
          try {
            let invalid_royalty = '9000';
            sell_order_2.royalty = invalid_royalty;
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait();
            throw null;
          } catch (err) {
            expect(err.message).to.include('invalid royalty: sum of fee and royalty must no larger than 100%');
          }
        })
        it('revert with ETH non-auction order: platform fee set after royalty, and sum of them is larger than 100%', async function () {
          try {
            // execute a transaction and set royalty to 10%
            tx = await exchange.connect(seller).matchAndTransfer(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: price });
            await tx.wait();
            // change platform fee to 95%
            tx = await exchange.connect(seller).changeFee('9500');
            await tx.wait();
            buy_order_0.sellSideAsset.value = tokenId_3;
            buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
            sell_order_0.sellSideAsset.value = tokenId_3;
            sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
            // in this transaction, throw on failure as sum of fees are larger than 1005
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: price });
            await tx.wait()
            throw null;
          } catch (err) {
            expect(err.message).to.include('Transaction reverted');
          }
        })
        it('revert with ERC20 non-auction order: platform fee set after royalty, and sum of them is larger than 100%', async function () {
          try {
            // execute a transaction and set royalty to 10%
            tx = await exchange.connect(seller).matchAndTransfer(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: price });
            await tx.wait();
            // change platform fee to 95%
            tx = await exchange.connect(seller).changeFee('9500');
            await tx.wait();
            buy_order_1.sellSideAsset.value = tokenId_3;
            buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
            sell_order_1.sellSideAsset.value = tokenId_3;
            sell_order_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_1)));
            // in this transaction, throw on failure as sum of fees are larger than 1005
            tx = await exchange.connect(buyer).matchAndTransfer(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1);
            await tx.wait()
            throw null;
          } catch (err) {
            expect(err.message).to.include('Arithmetic operation underflowed or overflowed outside of an unchecked block');
          }
        })
        it('revert with ERC20 auction order: platform fee set after royalty, and sum of them is larger than 100%', async function () {
          try {
            // execute a transaction and set royalty to 10%
            tx = await exchange.connect(seller).matchAndTransfer(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: price });
            await tx.wait();
            // change platform fee to 95%
            tx = await exchange.connect(seller).changeFee('9500');
            await tx.wait();
            buy_order_2.sellSideAsset.value = tokenId_3;
            buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
            sell_order_2.sellSideAsset.value = tokenId_3;
            sell_order_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_2)));
            // in this transaction, throw on failure as sum of fees are larger than 1005
            tx = await exchange.connect(seller).matchAndTransfer(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            await tx.wait()
            throw null;
          } catch (err) {
            expect(err.message).to.include('Arithmetic operation underflowed or overflowed outside of an unchecked block');
          }
        })
      })
    })
  })

}

module.exports = { shouldRevertWithMaliciousBehavior };