const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;
const { Order, hashOrder, hashMint } = require("./utils.js");
const { check } = require("prettier");
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4, tokenId_5 } = tokenIds;
const life_span = 60 * 60 * 24 * 7 // one week


function shouldWorkWithLegitimateBehavior() {
    context('with legitimate behaviors', function () {
        context('with minted nft', function () {
            beforeEach('with minted nft', async function () {
                // sign some tokenId
                let abiCoder = new ethers.utils.AbiCoder();

                let signature_0 = await seller.signMessage(ethers.utils.arrayify(hashMint(seller.address, tokenId_0)));
                let signature_1 = await seller.signMessage(ethers.utils.arrayify(hashMint(seller.address, tokenId_1)));
                let signature_2 = await seller.signMessage(ethers.utils.arrayify(hashMint(seller.address, tokenId_2)));
                let signature_3 = await seller.signMessage(ethers.utils.arrayify(hashMint(seller.address, tokenId_3)));
                // // mint tokenId_0, 1, 2 to seller
                tx = await committable.mint(seller.address, tokenId_0, signature_0);
                await tx.wait();
                tx = await committable.mint(seller.address, tokenId_1, signature_1);
                await tx.wait();
                tx = await committable.mint(seller.address, tokenId_2, signature_2);
                await tx.wait();
                tx = await committable.mint(seller.address, tokenId_3, signature_3);
                await tx.wait();
                // deploy Helper for test
                let Helper = await ethers.getContractFactory("Helper");
                helper = await Helper.deploy();
                await helper.deployed();

            })
            context("with legitimate order hash and sig", function () {
                it("should have correct order hash", async function () {
                    expect(await helper.hashOrder(buy_order_0)).to.equal(hashOrder(buy_order_0));
                    expect(await helper.hashOrder(sell_order_0)).to.equal(hashOrder(sell_order_0));
                    expect(await helper.hashOrder(buy_order_1)).to.equal(hashOrder(buy_order_1));
                    expect(await helper.hashOrder(sell_order_1)).to.equal(hashOrder(sell_order_1));
                    expect(await helper.hashOrder(sell_order_2)).to.equal(hashOrder(sell_order_2));
                    expect(await helper.hashOrder(sell_order_3)).to.equal(hashOrder(sell_order_3));

                })
                it("should have expected order sig", async function () {
                    expect(await helper.recover(hashOrder(buy_order_0), buy_order_sig_0)).to.equal(buyer.address);
                    expect(await helper.recover(hashOrder(sell_order_0), sell_order_sig_0)).to.equal(seller.address);
                    expect(await helper.recover(hashOrder(buy_order_1), buy_order_sig_1)).to.equal(buyer.address);
                    expect(await helper.recover(hashOrder(sell_order_1), sell_order_sig_1)).to.equal(seller.address);
                })
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
                    expect(await committable.ownerOf(tokenId_0)).to.equal(buyer.address);
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
                    expect(await exchange.checkOrderStatus(hashOrder(buy_order_0))).to.equal(false);
                    expect(await exchange.checkOrderStatus(hashOrder(sell_order_0))).to.equal(false);
                })
                it('both orders were flagged as finished via batch request', async function () {
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_0), hashOrder(sell_order_0)])).
                        to.deep.equal([false, false]);
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
                    expect(await committable.ownerOf(tokenId_1)).to.equal(buyer.address);
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
                    expect(await exchange.checkOrderStatus(hashOrder(buy_order_1))).to.equal(false);
                    expect(await exchange.checkOrderStatus(hashOrder(sell_order_1))).to.equal(false);
                })
                it('four orders were flagged as finished via batch request', async function () {
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_1), hashOrder(sell_order_1)])).
                        to.deep.equal([false, false]);
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
                    expect(await committable.ownerOf(tokenId_2)).to.equal(buyer.address);
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
                    expect(await exchange.checkOrderStatus(hashOrder(buy_order_2))).to.equal(false);
                    expect(await exchange.checkOrderStatus(hashOrder(sell_order_2))).to.equal(false);
                })
                it('both orders were flagged as finished via batch request', async function () {
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_2), hashOrder(sell_order_2)])).
                        to.deep.equal([false, false]);
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

                    let tx = await exchange.connect(seller).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
                    await tx.wait();
                })
                it('owner of nft token changed', async function () {
                    expect(await committable.ownerOf(tokenId_3)).to.equal(buyer.address);
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
                    expect(await exchange.checkOrderStatus(hashOrder(buy_order_3))).to.equal(false);
                    expect(await exchange.checkOrderStatus(hashOrder(sell_order_3))).to.equal(false);
                })
                it('four orders were flagged as finished via batch request', async function () {
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_3), hashOrder(sell_order_3), hashOrder(buy_order_3), hashOrder(sell_order_3)])).
                        to.deep.equal([false, false, false, false]);
                })
            })

            context('[event test] with ETH orders: no royalty', function () {
                it('emit desired exchange event', async function () {
                    let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
                    expect(tx).to.emit(exchange, 'OrderMatched')
                        .withArgs(hashOrder(buy_order_0), hashOrder(sell_order_0), buyer.address, seller.address, buy_order_0.paymentToken, buy_order_0.value);
                })
                it('emit desired committable event', async function () {
                    let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
                    expect(tx).to.emit(committable, 'Transfer')
                        .withArgs(seller.address, buyer.address, tokenId_0);
                })
            })

            context('[event test] with ETH orders: have royalty', function () {
                it('emit desired exchange event', async function () {
                    let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: PRICE });
                    expect(tx).to.emit(exchange, 'OrderMatched')
                        .withArgs(hashOrder(buy_order_1), hashOrder(sell_order_1), buyer.address, seller.address, buy_order_1.paymentToken, buy_order_1.value);
                })
                it('emit desired committable event', async function () {
                    let tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: PRICE });
                    expect(tx).to.emit(committable, 'Transfer')
                        .withArgs(seller.address, buyer.address, tokenId_1);
                })

            })

            context('[event test] with ERC20 orders: no royalty', function () {
                it('emit desired exchange event', async function () {
                    let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
                    expect(tx).to.emit(exchange, 'OrderMatched')
                        .withArgs(hashOrder(buy_order_2), hashOrder(sell_order_2), buyer.address, seller.address, buy_order_2.paymentToken, buy_order_2.value);
                })
                it('emit desired committable event', async function () {
                    let tx = await exchange.connect(seller).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
                    expect(tx).to.emit(committable, 'Transfer')
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
                    expect(tx).to.emit(token, 'Transfer')
                        .withArgs(buyer.address, seller.address, _pay.toString());
                    expect(tx).to.emit(token, 'Transfer')
                        .withArgs(buyer.address, feeRecipient, _fee.toString());
                    // expect(tx).to.emit(token, 'Transfer')
                    //     .withArgs(buyer.address, royaltyRecipient.address, _royalty.toString());
                })
            })
            context('[event test] with ERC20 orders: have royalty', function () {
                it('emit desired exchange event', async function () {
                    let tx = await exchange.connect(seller).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
                    expect(tx).to.emit(exchange, 'OrderMatched')
                        .withArgs(hashOrder(buy_order_3), hashOrder(sell_order_3), buyer.address, seller.address, buy_order_3.paymentToken, buy_order_2.value);
                })
                it('emit desired committable event', async function () {
                    let tx = await exchange.connect(seller).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
                    expect(tx).to.emit(committable, 'Transfer')
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
                    expect(tx).to.emit(token, 'Transfer')
                        .withArgs(buyer.address, seller.address, _pay.toString());
                    expect(tx).to.emit(token, 'Transfer')
                        .withArgs(buyer.address, feeRecipient, _fee.toString());
                    expect(tx).to.emit(token, 'Transfer')
                        .withArgs(buyer.address, royaltyRecipient, _royalty.toString());
                })
            })
        })
        context('with lazy-minted nft', function () {
            beforeEach('with lazy-minted nft', async function () {
            })
            context("with ETH orders", function () {
                beforeEach(async function () {
                    originalBuyerBalance = await buyer.getBalance();
                    originalSellerBalance = await seller.getBalance();
                    originalRecipientBalance = await recipient.getBalance();
                    fee = await exchange.getFee();
                    _fee = (ethers.BigNumber.from(buy_order_4.value)).div(ethers.BigNumber.from('10000')).mul(fee);
                    royalty = buy_order_4.royalty;
                    _royalty = (ethers.BigNumber.from(buy_order_4.value)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();

                    let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
                    gasPrice = tx.gasPrice;
                    gasUsed = (await tx.wait()).gasUsed;
                    gasFee = gasPrice.mul(gasUsed);

                })
                it('owner of nft token changed', async function () {
                    expect(await committable.ownerOf(tokenId_4)).to.equal(buyer.address);
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
                    expect(await exchange.checkOrderStatus(hashOrder(buy_order_4))).to.equal(false);
                    expect(await exchange.checkOrderStatus(hashOrder(sell_order_4))).to.equal(false);
                })
                it('both orders were flagged as finished via batch request', async function () {
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_4), hashOrder(sell_order_4)])).
                        to.deep.equal([false, false]);
                })
            })
            context("with ERC20 orders", function () {
                beforeEach(async function () {

                    originalBuyerBalance = await token.balanceOf(buyer.address);
                    originalSellerBalance = await token.balanceOf(seller.address);
                    originalRecipientBalance = await token.balanceOf(recipient.address);

                    fee = await exchange.getFee();
                    _fee = (ethers.BigNumber.from(buy_order_5.value)).div(ethers.BigNumber.from('10000')).mul(fee);
                    royalty = buy_order_5.royalty;
                    _royalty = (ethers.BigNumber.from(buy_order_5.value)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();

                    tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
                    gasPrice = tx.gasPrice;
                    gasUsed = (await tx.wait()).gasUsed;
                    gasFee = gasPrice.mul(gasUsed);

                })
                it('owner of nft token changed', async function () {
                    expect(await committable.ownerOf(tokenId_5)).to.equal(buyer.address);
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
                it('both orders were flagged as finished', async function () {
                    expect(await exchange.checkOrderStatus(hashOrder(buy_order_5))).to.equal(false);
                    expect(await exchange.checkOrderStatus(hashOrder(sell_order_5))).to.equal(false);
                })
                it('four orders were flagged as finished via batch request', async function () {
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_5), hashOrder(sell_order_5)])).
                        to.deep.equal([false, false]);
                })
            })

            context('[event test] with ETH orders', function () {
                it('emit desired exchange event', async function () {
                    let fee = await exchange.getFee();
                    let royalty = buy_order_4.royalty;
                    let _fee = (ethers.BigNumber.from(buy_order_4.value)).div(ethers.BigNumber.from('10000')).mul(fee).toString();
                    let _royalty = (ethers.BigNumber.from(buy_order_4.value)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();
                    let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
                    expect(tx).to.emit(exchange, 'OrderMatched')
                        .withArgs(hashOrder(buy_order_4), hashOrder(sell_order_4), buyer.address, seller.address, buy_order_4.paymentToken, buy_order_4.value);
                })
                it('emit desired committable event', async function () {
                    let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
                    expect(tx).to.emit(committable, 'Transfer')
                        .withArgs(ZERO_ADDRESS, seller.address, tokenId_4);
                    expect(tx).to.emit(committable, 'Transfer')
                        .withArgs(seller.address, buyer.address, tokenId_4);
                })
            })

            context('[event test] with ERC20 orders', function () {
                it('emit desired exchange event', async function () {
                    let fee = await exchange.getFee();
                    let royalty = buy_order_5.royalty;
                    let _fee = (ethers.BigNumber.from(buy_order_5.value)).div(ethers.BigNumber.from('10000')).mul(fee).toString();
                    let _royalty = (ethers.BigNumber.from(buy_order_5.value)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();
                    let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
                    expect(tx).to.emit(exchange, 'OrderMatched')
                        .withArgs(hashOrder(buy_order_5), hashOrder(sell_order_5), buyer.address, seller.address, buy_order_5.paymentToken, buy_order_5.value);
                })
                it('emit desired committable event', async function () {
                    let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
                    expect(tx).to.emit(committable, 'Transfer')
                        .withArgs(ZERO_ADDRESS, seller.address, tokenId_5);
                    expect(tx).to.emit(committable, 'Transfer')
                        .withArgs(seller.address, buyer.address, tokenId_5);
                })
                it('emit desired token event', async function () {
                    let fee = await exchange.getFee();
                    let feeRecipient = await exchange.getRecipient();
                    // let royaltyRecipient = buy_order_2.royaltyRecipient;
                    // let royalty = buy_order_2.royalty;
                    let _fee = (ethers.BigNumber.from(buy_order_5.value)).div(ethers.BigNumber.from('10000')).mul(fee);
                    // let _royalty = (ethers.BigNumber.from(buy_order_2.value)).div(ethers.BigNumber.from('10000')).mul(royalty);
                    let _pay = (ethers.BigNumber.from(buy_order_5.value).sub(_fee));
                    // let _pay = (ethers.BigNumber.from(buy_order_2.value).sub(_fee).sub(_royalty));
                    let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
                    expect(tx).to.emit(token, 'Transfer')
                        .withArgs(buyer.address, seller.address, _pay.toString());
                    expect(tx).to.emit(token, 'Transfer')
                        .withArgs(buyer.address, recipient.address, _fee.toString());
                })
            })


        })
        context('other behaviors', function () {
            it('should cancel order correctly', async function () {
                let tx = await exchange.connect(buyer).cancelOrder(buy_order_0);
                await tx.wait();
                expect(await exchange.checkOrderStatus(hashOrder(buy_order_0))).to.equal(false);
            })
            it('[EVENT] cancel order', async function () {
                let tx = await exchange.connect(buyer).cancelOrder(buy_order_0);
                expect(tx).to.emit(exchange, 'OrderCancelled')
                    .withArgs(hashOrder(buy_order_0), buy_order_0.maker);
            })


        })
    })
}

module.exports = { shouldWorkWithLegitimateBehavior };