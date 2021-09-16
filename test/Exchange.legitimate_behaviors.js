const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;
const { CommitInfo, hashCommitInfo, Order, hashOrder, Asset, hashAsset } = require("./utils.js");
const { tokenIds, commitInfo } = require('./commitInfo.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3 } = tokenIds;
const { commitInfo_0, commitInfo_1, commitInfo_2, commitInfo_3 } = commitInfo;
const ETH_CLASS = '0xaaaebeba';
const ERC20_CLASS = '0x8ae85d84';
const ERC721_CLASS = '0x73ad2146';
const ROYALTY = 1000; // 10 %
const life_span = 60 * 60 * 24 * 7 // one week


function shouldWorkWithLegitimateBehaviors() {
    context('with legitimate behaviors', function () {
        context('with minted nft', function () {
            beforeEach('with minted nft', async function () {
                // sign some tokens commit info
                let commitInfo_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_0)));
                let commitInfo_sig_3 = await seller.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_3)));
                // mint tokenId_0 to seller, tokenId_3 to creator
                tx = await tokenProxy.mint(seller.address, tokenId_0, commitInfo_0, commitInfo_sig_0);
                await tx.wait();
                tx = await tokenProxy.mint(creator.address, tokenId_3, commitInfo_3, commitInfo_sig_3);
                await tx.wait();
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
                    let tx = await exchange.connect(seller).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: price })
                    buy_order_0.sellSideAsset.amountOrId = tokenId_3;
                    buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
                    sell_order_0.sellSideAsset.amountOrId = tokenId_3;
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
                    expect(await tokenProxy.ownerOf(tokenId_3)).to.equal(buyer.address);
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
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_0), hashOrder(sell_order_0), hashOrder(buy_order_3), hashOrder(sell_order_3)])).
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
                    let tx = await exchange.connect(seller).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: price })
                    await tx.wait();

                    buy_order_1.sellSideAsset.amountOrId = tokenId_3;
                    buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
                    sell_order_1.sellSideAsset.amountOrId = tokenId_3;
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
                    expect(await tokenProxy.ownerOf(tokenId_3)).to.equal(buyer.address);
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
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_1), hashOrder(sell_order_1), hashOrder(buy_order_3), hashOrder(sell_order_3)])).
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
                    let tx = await exchange.connect(seller).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: price })
                    await tx.wait();

                    buy_order_2.sellSideAsset.amountOrId = tokenId_3;
                    buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
                    sell_order_2.sellSideAsset.amountOrId = tokenId_3;
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
                    expect(await tokenProxy.ownerOf(tokenId_3)).to.equal(buyer.address);
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
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_2), hashOrder(sell_order_2), hashOrder(buy_order_3), hashOrder(sell_order_3)])).
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
        context.only('with lazy-minted nft', function () {
            beforeEach('with lazy-minted nft', async function () {
                // sign some tokens commit info
                commitInfo_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_0)));
                commitInfo_sig_1 = await seller.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_1)));
                commitInfo_sig_2 = await seller.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_2)));
                commitInfo_sig_3 = await seller.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_3)));
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

                    let tx = await exchange.connect(buyer).matchOrderAndMint(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, commitInfo_0, commitInfo_sig_0, { value: price });
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
                    let tx = await exchange.connect(seller).matchOrderAndMint(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, commitInfo_3, commitInfo_sig_3, { value: price })
                    buy_order_0.sellSideAsset.amountOrId = tokenId_3;
                    buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
                    sell_order_0.sellSideAsset.amountOrId = tokenId_3;
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
                    expect(await tokenProxy.ownerOf(tokenId_3)).to.equal(buyer.address);
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
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_0), hashOrder(sell_order_0), hashOrder(buy_order_3), hashOrder(sell_order_3)])).
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

                    let tx = await exchange.connect(buyer).matchOrderAndMint(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, commitInfo_1, commitInfo_sig_1);
                    await tx.wait();
                })
                it('owner of nft token changed', async function () {
                    expect(await tokenProxy.ownerOf(tokenId_1)).to.equal(buyer.address);
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
                    // seller purchase nft(tokenId_3) from creator, patent fee was set
                    let tx = await exchange.connect(seller).matchOrderAndMint(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, commitInfo_3, commitInfo_sig_3, { value: price })
                    await tx.wait();

                    buy_order_1.sellSideAsset.amountOrId = tokenId_3;
                    buy_order_sig_1 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_1)));
                    sell_order_1.sellSideAsset.amountOrId = tokenId_3;
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
                    expect(await tokenProxy.ownerOf(tokenId_3)).to.equal(buyer.address);
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
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_1), hashOrder(sell_order_1), hashOrder(buy_order_3), hashOrder(sell_order_3)])).
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

                    let tx = await exchange.connect(seller).matchOrderAndMint(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, commitInfo_2, commitInfo_sig_2);
                    await tx.wait();

                })
                it('owner of nft token changed', async function () {
                    expect(await tokenProxy.ownerOf(tokenId_2)).to.equal(buyer.address);
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
                    let tx = await exchange.connect(seller).matchOrderAndMint(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, commitInfo_3, commitInfo_sig_3, { value: price })
                    await tx.wait();

                    buy_order_2.sellSideAsset.amountOrId = tokenId_3;
                    buy_order_sig_2 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_2)));
                    sell_order_2.sellSideAsset.amountOrId = tokenId_3;
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
                    expect(await tokenProxy.ownerOf(tokenId_3)).to.equal(buyer.address);
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
                    expect(await exchange.checkOrderStatusBatch([hashOrder(buy_order_2), hashOrder(sell_order_2), hashOrder(buy_order_3), hashOrder(sell_order_3)])).
                        to.deep.equal([false, false, false, false]);
                })
            })

            context('[event test] with non-aution ETH orders executed', function () {
                it('emit desired exchange event', async function () {
                    let fee = await exchange.getFee();
                    let royalty = await exchange.getRoyalty(buy_order_0.sellSideAsset.contractAddress, buy_order_0.sellSideAsset.amountOrId);
                    let _fee = (ethers.BigNumber.from(buy_order_0.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(fee).toString();
                    let _royalty = (ethers.BigNumber.from(buy_order_0.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();
                    let tx = await exchange.connect(buyer).matchOrderAndMint(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, commitInfo_0, commitInfo_sig_0, { value: price });
                    expect(tx).to.emit(exchange, 'OrderMatched')
                        .withArgs(hashOrder(buy_order_0), hashOrder(sell_order_0), buyer.address, seller.address, tokenId_0, sell_order_0.isAuction, buy_order_0.buySideAsset.assetClass, buy_order_0.buySideAsset.contractAddress, buy_order_0.buySideAsset.amountOrId);
                })
                it('emit desired tokenProxy event', async function () {
                    let tx = await exchange.connect(buyer).matchOrderAndMint(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, commitInfo_0, commitInfo_sig_0, { value: price });
                    expect(tx).to.emit(tokenProxy, 'Transfer')
                        .withArgs(seller.address, buyer.address, tokenId_0);
                })
                it('emit desired fee change event', async function () {
                    let tx = await exchange.connect(buyer).matchOrderAndMint(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, commitInfo_0, commitInfo_sig_0, { value: price });
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
                    let tx = await exchange.connect(buyer).matchOrderAndMint(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, commitInfo_1, commitInfo_sig_1);
                    expect(tx).to.emit(exchange, 'OrderMatched')
                        .withArgs(hashOrder(buy_order_1), hashOrder(sell_order_1), buyer.address, seller.address, tokenId_1, sell_order_1.isAuction, buy_order_1.buySideAsset.assetClass, buy_order_1.buySideAsset.contractAddress, buy_order_1.buySideAsset.amountOrId);
                })
                it('emit desired tokenProxy event', async function () {
                    let tx = await exchange.connect(buyer).matchOrderAndMint(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, commitInfo_1, commitInfo_sig_1);
                    expect(tx).to.emit(tokenProxy, 'Transfer')
                        .withArgs(seller.address, buyer.address, tokenId_1);
                })
                it('emit desired fee change event', async function () {
                    let tx = await exchange.connect(buyer).matchOrderAndMint(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, commitInfo_1, commitInfo_sig_1);
                    expect(tx).to.emit(exchange, 'RoyaltyChanged')
                        .withArgs(buy_order_1.sellSideAsset.contractAddress, tokenId_1, '0', ROYALTY);
                })
            })

            context('[event test] with auction ERC20 orders executed', function () {
                it('emit desired exchange event', async function () {
                    let fee = await exchange.getFee();
                    let royalty = await exchange.getRoyalty(buy_order_2.sellSideAsset.contractAddress, buy_order_2.sellSideAsset.amountOrId);
                    let _fee = (ethers.BigNumber.from(buy_order_2.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(fee).toString();
                    let _royalty = (ethers.BigNumber.from(buy_order_2.buySideAsset.amountOrId)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();
                    let tx = await exchange.connect(seller).matchOrderAndMint(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, commitInfo_2, commitInfo_sig_2);
                    expect(tx).to.emit(exchange, 'OrderMatched')
                        .withArgs(hashOrder(buy_order_2), hashOrder(sell_order_2), buyer.address, seller.address, tokenId_2, sell_order_2.isAuction, buy_order_2.buySideAsset.assetClass, buy_order_2.buySideAsset.contractAddress, buy_order_2.buySideAsset.amountOrId);
                })
                it('emit desired tokenProxy event', async function () {
                    let tx = await exchange.connect(seller).matchOrderAndMint(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, commitInfo_2, commitInfo_sig_2);
                    expect(tx).to.emit(tokenProxy, 'Transfer')
                        .withArgs(seller.address, buyer.address, tokenId_2);
                })
                it('emit desired fee change event', async function () {
                    let tx = await exchange.connect(seller).matchOrderAndMint(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2, commitInfo_2, commitInfo_sig_2);
                    expect(tx).to.emit(exchange, 'RoyaltyChanged')
                        .withArgs(buy_order_2.sellSideAsset.contractAddress, tokenId_2, '0', ROYALTY);
                })
            })
        })
    })
}

module.exports = { shouldWorkWithLegitimateBehaviors };