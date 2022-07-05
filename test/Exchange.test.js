const { expect } = require("chai");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

let { hashOrder, exchange_domain, order_types, erc721_domain, mint_types } = require("./utils.js");
const { projects, commits, tokenIds } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4, tokenId_5, tokenId_6, tokenId_7 } = tokenIds;
ROYALTY = '1000'; // 10%
const life_span = 60 * 60 * 24 * 7 // one week
FEE = '1000' // 10%
PRICE = ethers.utils.parseEther('100').toString();

DEADLINE = 0;
UINT256_MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
UINT256_ZERO = '0x00'



describe('Exchange', function () {
  context('with deployed contracts initialized orders and fees', function () {
    beforeEach(async function () {

      /* get signers */
      [seller, buyer, royaltyRecipient, recipient, newRecipient, operator, ...others] = await ethers.getSigners();
      /* deploy helper */

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

      erc721_domain.verifyingContract = tokenProxy.address
      /* deploy exchange contract */
      let Exchange = await ethers.getContractFactory("Exchange");
      exchange = await Exchange.deploy(controller.address);
      await exchange.deployed();

      exchange_domain.verifyingContract = exchange.address
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
       * Below we create multiple order_types of order pairs:
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

      buy_order_sig_0 = await buyer._signTypedData(exchange_domain, order_types, buy_order_0);
      sell_order_sig_0 = await seller._signTypedData(exchange_domain, order_types, sell_order_0);

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

      buy_order_sig_1 = await buyer._signTypedData(exchange_domain, order_types, buy_order_1);
      sell_order_sig_1 = await seller._signTypedData(exchange_domain, order_types, sell_order_1);
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
      buy_order_sig_2 = await buyer._signTypedData(exchange_domain, order_types, buy_order_2);
      sell_order_sig_2 = await seller._signTypedData(exchange_domain, order_types, sell_order_2);

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
      buy_order_sig_3 = await buyer._signTypedData(exchange_domain, order_types, buy_order_3);
      sell_order_sig_3 = await seller._signTypedData(exchange_domain, order_types, sell_order_3);

      // generate order pairs: pay eth to mint erc721, no royalty
      // sign tokenId from server
      let signature_4 = await seller._signTypedData(erc721_domain, mint_types, {
        creator: seller.address,
        tokenId: tokenId_4
      });


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
      buy_order_sig_4 = await buyer._signTypedData(exchange_domain, order_types, buy_order_4);
      sell_order_sig_4 = await seller._signTypedData(exchange_domain, order_types, sell_order_4);

      // generate order pairs: pay erc20 to mint erc721, no royalty
      // sign tokenId from server
      let signature_5 = await seller._signTypedData(erc721_domain, mint_types, {
        creator: seller.address,
        tokenId: tokenId_5
      });

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
      buy_order_sig_5 = await buyer._signTypedData(exchange_domain, order_types, buy_order_5);
      sell_order_sig_5 = await seller._signTypedData(exchange_domain, order_types, sell_order_5);

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
      buy_order_sig_6 = await buyer._signTypedData(exchange_domain, order_types, buy_order_6);
      sell_order_sig_6 = await seller._signTypedData(exchange_domain, order_types, sell_order_6);

      // generate order pairs: pay erc20 to mint erc721, no royalty (Auction type)
      // sign tokenId from server
      let signature_7 = await seller._signTypedData(erc721_domain, mint_types, {
        creator: seller.address,
        tokenId: tokenId_7
      });

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
      buy_order_sig_7 = await buyer._signTypedData(exchange_domain, order_types, buy_order_7);
      sell_order_sig_7 = await seller._signTypedData(exchange_domain, order_types, sell_order_7);




    })
    context('with legitimate behaviors', function () {
      context('with minted nft', function () {
        beforeEach('with minted nft', async function () {
          // sign some tokenId
          let signature_0 = await seller._signTypedData(erc721_domain, mint_types, {
            creator: seller.address,
            tokenId: tokenId_0
          });
          let signature_1 = await seller._signTypedData(erc721_domain, mint_types, {
            creator: seller.address,
            tokenId: tokenId_1
          });
          let signature_2 = await seller._signTypedData(erc721_domain, mint_types, {
            creator: seller.address,
            tokenId: tokenId_2
          });
          let signature_3 = await seller._signTypedData(erc721_domain, mint_types, {
            creator: seller.address,
            tokenId: tokenId_3
          });
          let signature_6 = await seller._signTypedData(erc721_domain, mint_types, {
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
            expect(await exchange.checkOrderStatus(hashOrder(buy_order_0))).to.equal(false);
            expect(await exchange.checkOrderStatus(hashOrder(sell_order_0))).to.equal(false);
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
            expect(await exchange.checkOrderStatus(hashOrder(buy_order_1))).to.equal(false);
            expect(await exchange.checkOrderStatus(hashOrder(sell_order_1))).to.equal(false);
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
            expect(await exchange.checkOrderStatus(hashOrder(buy_order_2))).to.equal(false);
            expect(await exchange.checkOrderStatus(hashOrder(sell_order_2))).to.equal(false);
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
            expect(await exchange.checkOrderStatus(hashOrder(buy_order_3))).to.equal(false);
            expect(await exchange.checkOrderStatus(hashOrder(sell_order_3))).to.equal(false);
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
            expect(await exchange.checkOrderStatus(hashOrder(buy_order_6))).to.equal(false);
            expect(await exchange.checkOrderStatus(hashOrder(sell_order_6))).to.equal(false);
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
            expect(tx).to.emit(tokenProxy, 'Transfer')
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
            expect(tx).to.emit(tokenProxy, 'Transfer')
              .withArgs(seller.address, buyer.address, tokenId_1);
          })

        })

        context('[event test] with ERC20 orders: no royalty', function () {
          it('emit desired exchange event', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            expect(tx).to.emit(exchange, 'OrderMatched')
              .withArgs(hashOrder(buy_order_2), hashOrder(sell_order_2), buyer.address, seller.address, buy_order_2.paymentToken, buy_order_2.value);
          })
          it('emit desired committable event', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
            expect(tx).to.emit(tokenProxy, 'Transfer')
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
            let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
            expect(tx).to.emit(exchange, 'OrderMatched')
              .withArgs(hashOrder(buy_order_3), hashOrder(sell_order_3), buyer.address, seller.address, buy_order_3.paymentToken, buy_order_2.value);
          })
          it('emit desired committable event', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
            expect(tx).to.emit(tokenProxy, 'Transfer')
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
            expect(await tokenProxy.ownerOf(tokenId_4)).to.equal(buyer.address);
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
            expect(await tokenProxy.ownerOf(tokenId_5)).to.equal(buyer.address);
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

        })

        context("with ERC20 orders (Auction)", function () {
          beforeEach(async function () {

            originalBuyerBalance = await token.balanceOf(buyer.address);
            originalSellerBalance = await token.balanceOf(seller.address);
            originalRecipientBalance = await token.balanceOf(recipient.address);

            fee = await exchange.getFee();
            _fee = (ethers.BigNumber.from(buy_order_7.value)).div(ethers.BigNumber.from('10000')).mul(fee);
            royalty = buy_order_7.royalty;
            _royalty = (ethers.BigNumber.from(buy_order_7.value)).div(ethers.BigNumber.from('10000')).mul(royalty).toString();

            tx = await exchange.connect(seller).matchOrder(buy_order_7, buy_order_sig_7, sell_order_7, sell_order_sig_7);
            gasPrice = tx.gasPrice;
            gasUsed = (await tx.wait()).gasUsed;
            gasFee = gasPrice.mul(gasUsed);

          })
          it('owner of nft token changed', async function () {
            expect(await tokenProxy.ownerOf(tokenId_7)).to.equal(buyer.address);
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
            expect(await exchange.checkOrderStatus(hashOrder(buy_order_7))).to.equal(false);
            expect(await exchange.checkOrderStatus(hashOrder(sell_order_7))).to.equal(false);
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
            expect(tx).to.emit(tokenProxy, 'Transfer')
              .withArgs(ZERO_ADDRESS, seller.address, tokenId_4);
            expect(tx).to.emit(tokenProxy, 'Transfer')
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
            expect(tx).to.emit(tokenProxy, 'Transfer')
              .withArgs(ZERO_ADDRESS, seller.address, tokenId_5);
            expect(tx).to.emit(tokenProxy, 'Transfer')
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
    context('with malicious order behaviors', function () {
      context('with standard orders and lazy-mint orders', function () {
        beforeEach('with minted nft', async function () {
          // sign some tokenId
          let signature_0 = await seller._signTypedData(erc721_domain, mint_types, {
            creator: seller.address,
            tokenId: tokenId_0
          });
          let signature_1 = await seller._signTypedData(erc721_domain, mint_types, {
            creator: seller.address,
            tokenId: tokenId_1
          });
          let signature_2 = await seller._signTypedData(erc721_domain, mint_types, {
            creator: seller.address,
            tokenId: tokenId_2
          });
          let signature_3 = await seller._signTypedData(erc721_domain, mint_types, {
            creator: seller.address,
            tokenId: tokenId_3
          });
          let signature_6 = await seller._signTypedData(erc721_domain, mint_types, {
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
          it('revert with ETH lazy-mint orders ', async function () {
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
        context('when called by unexpected user', function () {
          it('revert with buyer call erc20 standard order', async function () {
            try {
              await exchange.connect(buyer).matchOrder(buy_order_6, buy_order_sig_6, sell_order_6, sell_order_sig_6);
              throw null;
            } catch (err) {
              expect(err.message).to.include("must be called by legit user")
            }
          })
          it('revert with buyer call erc20 lazy-mint order', async function () {
            try {
              await exchange.connect(buyer).matchOrder(buy_order_7, buy_order_sig_7, sell_order_7, sell_order_sig_7);
              throw null;
            } catch (err) {
              expect(err.message).to.include("must be called by legit user")
            }
          })
        })
        context('when buy order exchange address does not match', function () {
          it('revert with ETH standard orders', async function () {
            try {
              exchange_domain.verifyingContract = ZERO_ADDRESS;
              buy_order_sig_0 = await buyer._signTypedData(exchange_domain, order_types, buy_order_0);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
          it('revert with ERC20 standard orders', async function () {
            try {
              exchange_domain.verifyingContract = ZERO_ADDRESS;
              buy_order_sig_3 = await buyer._signTypedData(exchange_domain, order_types, buy_order_3);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
          it('revert with ETH lazy-mint orders', async function () {
            try {
              exchange_domain.verifyingContract = ZERO_ADDRESS;
              buy_order_sig_4 = await buyer._signTypedData(exchange_domain, order_types, buy_order_4);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
          it('revert with ERC20 lazy-mint orders', async function () {
            try {
              exchange_domain.verifyingContract = ZERO_ADDRESS;
              buy_order_sig_5 = await buyer._signTypedData(exchange_domain, order_types, buy_order_5);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5, { value: PRICE });
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
              exchange_domain.verifyingContract = ZERO_ADDRESS;
              sell_order_sig_0 = await seller._signTypedData(exchange_domain, order_types, sell_order_0);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
          it('revert with ERC20 standard orders', async function () {
            try {
              exchange_domain.verifyingContract = ZERO_ADDRESS;
              sell_order_sig_3 = await seller._signTypedData(exchange_domain, order_types, sell_order_3);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
          it('revert with ETH lazy-mint orders', async function () {
            try {
              exchange_domain.verifyingContract = ZERO_ADDRESS;
              sell_order_sig_4 = await seller._signTypedData(exchange_domain, order_types, sell_order_4);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order signature');
            }
          })
          it('revert with ERC20 lazy-mint orders', async function () {
            try {
              exchange_domain.verifyingContract = ZERO_ADDRESS;
              sell_order_sig_5 = await seller._signTypedData(exchange_domain, order_types, sell_order_5);

              let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5, { value: PRICE });
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
        context('when buy order bid price is less than sell order ask price ', function () {
          it('revert with ETH standard order', async function () {
            buy_order_0.value = ethers.utils.parseEther('0.9').toString();
            buy_order_sig_0 = await buyer._signTypedData(exchange_domain, order_types, buy_order_0);

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
            buy_order_sig_2 = await buyer._signTypedData(exchange_domain, order_types, buy_order_2);

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
            buy_order_sig_4 = await buyer._signTypedData(exchange_domain, order_types, buy_order_4);

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
            buy_order_sig_5 = await buyer._signTypedData(exchange_domain, order_types, buy_order_5);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5, { value: buy_order_5.value });
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
            buy_order_sig_0 = await buyer._signTypedData(exchange_domain, order_types, buy_order_0);

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
            buy_order_sig_2 = await buyer._signTypedData(exchange_domain, order_types, buy_order_2);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ETH lazy-mint order', async function () {
            buy_order_4.target = ZERO_ADDRESS;
            buy_order_sig_4 = await buyer._signTypedData(exchange_domain, order_types, buy_order_4);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 lazy-mint order', async function () {
            buy_order_5.target = ZERO_ADDRESS;
            buy_order_sig_5 = await buyer._signTypedData(exchange_domain, order_types, buy_order_5);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
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
            buy_order_sig_0 = await buyer._signTypedData(exchange_domain, order_types, buy_order_0);

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
            buy_order_sig_2 = await buyer._signTypedData(exchange_domain, order_types, buy_order_2);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ETH lazy-mint order', async function () {
            buy_order_4.tokenId = tokenId_1;
            buy_order_sig_4 = await buyer._signTypedData(exchange_domain, order_types, buy_order_4);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 lazy-mint order', async function () {
            buy_order_5.tokenId = tokenId_1;
            buy_order_sig_5 = await buyer._signTypedData(exchange_domain, order_types, buy_order_5);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
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
            buy_order_sig_0 = await buyer._signTypedData(exchange_domain, order_types, buy_order_0);

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
            buy_order_sig_2 = await buyer._signTypedData(exchange_domain, order_types, buy_order_2);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ETH lazy-mint order', async function () {
            buy_order_4.start = Date.now() * 10;
            buy_order_sig_4 = await buyer._signTypedData(exchange_domain, order_types, buy_order_4);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: buy_order_4.value });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 lazy-mint order', async function () {
            buy_order_5.start = Date.now() * 10;
            buy_order_sig_5 = await buyer._signTypedData(exchange_domain, order_types, buy_order_5);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5, { value: buy_order_5.value });
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
            buy_order_sig_0 = await buyer._signTypedData(exchange_domain, order_types, buy_order_0);

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
            buy_order_sig_2 = await buyer._signTypedData(exchange_domain, order_types, buy_order_2);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ETH lazy-mint order', async function () {
            buy_order_4.end = 1;
            buy_order_sig_4 = await buyer._signTypedData(exchange_domain, order_types, buy_order_4);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: buy_order_4.value });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 lazy-mint order', async function () {
            buy_order_5.end = 1;
            buy_order_sig_5 = await buyer._signTypedData(exchange_domain, order_types, buy_order_5);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5, { value: buy_order_5.value });
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
            sell_order_sig_0 = await seller._signTypedData(exchange_domain, order_types, sell_order_0);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_0, buy_order_sig_0, sell_order_0, sell_order_sig_0, { value: buy_order_0.value });
              await tx.wait();
              throw null;
            } catch (err) {
              console.log(err.message)

              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 standard order', async function () {
            sell_order_2.end = 1;
            sell_order_sig_2 = await seller._signTypedData(exchange_domain, order_types, sell_order_2);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_2, buy_order_sig_2, sell_order_2, sell_order_sig_2);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ETH lazy-mint order', async function () {
            sell_order_4.end = 1;
            sell_order_sig_4 = await seller._signTypedData(exchange_domain, order_types, sell_order_4);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: buy_order_4.value });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 lazy-mint order', async function () {
            sell_order_5.end = 1;
            sell_order_sig_5 = await seller._signTypedData(exchange_domain, order_types, sell_order_5);

            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5, { value: buy_order_5.value });
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
          it('revert with ETH lazy-mint order', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
            await tx.wait();
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 lazy-mint order', async function () {
            let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
            await tx.wait();
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
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
          it('revert with ETH lazy-mint order', async function () {
            let tx = await exchange.connect(buyer).cancelOrder(buy_order_4);
            await tx.wait();
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 lazy-mint order', async function () {
            let tx = await exchange.connect(buyer).cancelOrder(buy_order_5);
            await tx.wait();
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
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
          it('revert with ETH lazy-mint order', async function () {
            let tx = await exchange.connect(seller).cancelOrder(sell_order_4);
            await tx.wait();
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with ERC20 lazy-mint order', async function () {
            let tx = await exchange.connect(seller).cancelOrder(sell_order_5);
            await tx.wait();
            try {
              let tx = await exchange.connect(buyer).matchOrder(buy_order_5, buy_order_sig_5, sell_order_5, sell_order_sig_5);
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
              console.log(err.message)
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
              buy_order_sig_1 = await buyer._signTypedData(exchange_domain, order_types, buy_order_1);
              sell_order_sig_1 = await seller._signTypedData(exchange_domain, order_types, sell_order_1);


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
              buy_order_sig_3 = await buyer._signTypedData(exchange_domain, order_types, buy_order_3);
              sell_order_sig_3 = await seller._signTypedData(exchange_domain, order_types, sell_order_3);
              tx = await exchange.connect(buyer).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })

          it('revert with invalid royalty in ETH order: sum of royalty and platform fee is larger than 100%', async function () {
            try {
              let newFee = 9500;
              tx = await exchange.changeFee(newFee);
              await tx.wait()

              tx = await exchange.connect(buyer).matchOrder(buy_order_1, buy_order_sig_1, sell_order_1, sell_order_sig_1, { value: PRICE });
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
          it('revert with invalid royalty set in ERC20 order: sum of royalty and platform fee is larger than 100%', async function () {
            try {
              let newFee = 9500;
              tx = await exchange.changeFee(newFee);
              await tx.wait()

              tx = await exchange.connect(seller).matchOrder(buy_order_3, buy_order_sig_3, sell_order_3, sell_order_sig_3);
              await tx.wait();
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid order parameters');
            }
          })
        })
        context('when seller does not own the token', function () {
          it('revert when the seller does not own the token', async function () {
            let tx = await tokenProxy.transferFrom(seller.address, buyer.address, tokenId_0);
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
        context('when mint sig is invalid', function () {
          it('revert when mint sig is invalid', async function () {
            let invalid_tokenSig = await seller._signTypedData(erc721_domain, mint_types, {
              creator: seller.address,
              tokenId: 123
            });
            sell_order_4.tokenSig = invalid_tokenSig;

            sell_order_sig_4 = await seller._signTypedData(exchange_domain, order_types, sell_order_4);

            try {
              tx = await exchange.connect(buyer).matchOrder(buy_order_4, buy_order_sig_4, sell_order_4, sell_order_sig_4, { value: PRICE });
              await tx.wait()
              throw null;
            } catch (err) {
              expect(err.message).to.include('invalid token signature');
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
      })
    })
  })
})