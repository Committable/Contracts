
const { keccak256 } = require('@ethersproject/keccak256');
const { ethers } = require('hardhat');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const NON_REPLACEMENT = '0x0000000000000000000000000000000000000000000000000000000000000000';
const REPLACEMENT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const SIG = '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const tokenId = '0xaaaaaa'

const interface = new ethers.utils.Interface([
  "function mint(address to, uint256 tokenId, bytes signature)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function transferWithPermit(address token, address from, address to, uint256 tokenId, uint256 deadline, bytes signature)",
  "function mintWithSig(address token, address to, uint256 tokenId, bytes signature)"
])




const encodeTransferWithPermit = (ERC721ContractAddress, from, to, tokenId, deadline = 0, signature = SIG) => {
  return interface.encodeFunctionData("transferWithPermit", [ERC721ContractAddress, from, to, tokenId, deadline, signature]);
}

const encodeTransfer = (from, to, tokenId) => {
  return interface.encodeFunctionData("transferFrom", [from, to, tokenId]);
}

const encodeTransferReplacement = (isBuyer) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let functionReplacement = '0x00000000';
  let paramsReplacement;
  if (isBuyer) {
    paramsReplacement = abiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32'],
      [REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT])
  } else {
    paramsReplacement = abiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32'],
      [NON_REPLACEMENT, REPLACEMENT, NON_REPLACEMENT])
  }
  return ethers.utils.hexConcat([functionReplacement, paramsReplacement]);
}

const encodeTransferWithPermitReplacement = (isBuyer) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let functionReplacement = '0x00000000';
  let paramsReplacement;
  if (isBuyer) {
    paramsReplacement = abiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [NON_REPLACEMENT, REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT])
  } else {
    paramsReplacement = abiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [NON_REPLACEMENT, NON_REPLACEMENT, REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT])
  }
  return ethers.utils.hexConcat([functionReplacement, paramsReplacement]);
}

const encodeMintWithSig = (to, tokenId, signature = SIG) => {
  return interface.encodeFunctionData("mint", [to, tokenId, signature]);
}

const encodeMintWithSigReplacement = (isBuyer) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let functionReplacement = '0x00000000';
  let paramsReplacement;
  if (isBuyer) {
    paramsReplacement = abiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [NON_REPLACEMENT, NON_REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT])
  } else {
    paramsReplacement = abiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT])
  }
  return ethers.utils.hexConcat([functionReplacement, paramsReplacement]);
}

const Order = class {
  constructor(exchange, isBuySide, maker, taker, paymentToken, value, royaltyRecipient, royalty, target, data, replacementPattern, start, end, salt) {
    this.exchange = exchange;
    this.isBuySide = isBuySide;
    this.maker = maker;
    this.taker = taker;
    this.paymentToken = paymentToken;
    this.value = value;
    this.royaltyRecipient = royaltyRecipient;
    this.royalty = royalty;
    this.target = target;
    this.data = data;
    this.replacementPattern = replacementPattern;
    this.start = start;
    this.end = end;
    this.salt = salt;
  }
}
const hashPermit = (operator, tokenId, nonce, deadline) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let permit_encode =
    abiCoder.encode(['address', 'uint256', 'uint256', 'uint256'], [operator, tokenId, nonce, deadline])
  return permit_hash = ethers.utils.keccak256(permit_encode);
}
const hashOrder = (order) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let order_encode =
    abiCoder.encode(['address', 'bool', 'address', 'address', 'address', 'uint256', 'address', 'uint256', 'address', 'bytes', 'bytes', 'uint256', 'uint256', 'uint256'],
      [order.exchange, order.isBuySide, order.maker, order.taker,
      order.paymentToken, order.value, order.royaltyRecipient, order.royalty, order.target, order.data, order.replacementPattern,
      order.start, order.end, order.salt]
    );

  return order_hash = ethers.utils.keccak256(order_encode);
}

const Utils = {
  Order: Order,
  hashOrder: hashOrder,
  hashPermit: hashPermit,
  encodeTransferWithPermit: encodeTransferWithPermit,
  encodeTransferWithPermitReplacement: encodeTransferWithPermitReplacement,
  encodeMintWithSig: encodeMintWithSig,
  encodeMintWithSigReplacement: encodeMintWithSigReplacement,
  encodeTransfer: encodeTransfer,
  encodeTransferReplacement: encodeTransferReplacement
}

module.exports = Utils;