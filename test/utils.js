
const { keccak256 } = require('@ethersproject/keccak256');
const { ethers } = require('hardhat');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const NON_REPLACEMENT = '0x0000000000000000000000000000000000000000000000000000000000000000';
const REPLACEMENT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const SIG = '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const tokenId = '0xaaaaaa'

const interface = new ethers.utils.Interface([
  "function mint(address creator, uint256 tokenId, bytes signature)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function mintAndTransfer(address creator, address to, uint256 tokenId, bytes signature)"
])



class Order {
  constructor(exchange, isBuySide, isAuction, maker, paymentToken, value, royaltyRecipient, royalty, target, tokenId, tokenSig, start, end, salt) {
    this.exchange = exchange;
    this.isBuySide = isBuySide;
    this.isAuction = isAuction;
    this.maker = maker;
    this.paymentToken = paymentToken;
    this.value = value;
    this.royaltyRecipient = royaltyRecipient;
    this.royalty = royalty;
    this.target = target;
    this.tokenId = tokenId;
    this.tokenSig = tokenSig;
    this.start = start;
    this.end = end;
    this.salt = salt;
  }
}

const hashMint = (creator, tokenId) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let mint_encode =
    abiCoder.encode(['address', 'uint256'], [creator, tokenId])
  return mint_hash = ethers.utils.keccak256(mint_encode);
}

const hashOrder = (order) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let order_encode =
    abiCoder.encode(['address','bool', 'bool', 'address', 'address', 'uint256', 'address', 'uint256', 'address', 'uint256', 'bytes', 'uint256', 'uint256', 'uint256'],
      [order.exchange, order.isBuySide, order.isAuction, order.maker,
      order.paymentToken, order.value, order.royaltyRecipient, order.royalty, order.target, order.tokenId, order.tokenSig,
      order.start, order.end, order.salt]
    );
  return order_hash = ethers.utils.keccak256(order_encode);
}

const Utils = {
  Order: Order,
  hashOrder: hashOrder,
  hashMint: hashMint,
}

module.exports = Utils;