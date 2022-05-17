
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

// All properties on a domain are optional
const DOMAIN = {
  name: 'Exchange',
  version: '1',
  chainId: 1337, // hardhat chianid
  verifyingContract: ZERO_ADDRESS // assign this value accordingly
};

// The named list of all type definitions
// keccak256("Order(bool isBuySide,bool isAuction,address maker,address paymentToken,uint256 value,address royaltyRecipient,uint256 royalty,address target,uint256 tokenId,bytes tokenSig,uint256 start,uint256 end,uint256 salt)")

const TYPES = {
  Order: [
    { name: 'isBuySide', type: 'bool' },
    { name: 'isAuction', type: 'bool' },
    { name: 'maker', type: 'address' },
    { name: 'paymentToken', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'royaltyRecipient', type: 'address' },
    { name: 'royalty', type: 'uint256' },
    { name: 'target', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'tokenSig', type: 'bytes' },
    { name: 'start', type: 'uint256' },
    { name: 'end', type: 'uint256' },
    { name: 'salt', type: 'uint256' },
  ]
};


class Order {
  constructor(isBuySide, isAuction, maker, paymentToken, value, royaltyRecipient, royalty, target, tokenId, tokenSig, start, end, salt) {
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
    abiCoder.encode(['bytes32', 'bool', 'bool', 'address', 'address', 'uint256', 'address', 'uint256', 'address', 'uint256', 'bytes32', 'uint256', 'uint256', 'uint256'],
      ['0x27032b6564c9c203f2bd0f0ccd36b2529e0811ecf18a68db0e2c9c09315bd252',
        order.isBuySide,
        order.isAuction,
        order.maker,
        order.paymentToken,
        order.value,
        order.royaltyRecipient,
        order.royalty,
        order.target,
        order.tokenId,
        ethers.utils.keccak256(order.tokenSig),
        order.start,
        order.end,
        order.salt]
    );
  return order_hash = ethers.utils.keccak256(order_encode);
}

const Utils = {
  Order: Order,
  hashOrder: hashOrder,
  hashMint: hashMint,
  DOMAIN,
  TYPES
}

module.exports = Utils;