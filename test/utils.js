
const { ethers } = require('hardhat');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const REPLACEMENT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const tokenId = '0xaaaaaa'

const interface = new ethers.utils.Interface([
  "function mint(address to, uint256 tokenId, bytes signature)",
  "function transferFrom(address token, address from, address to, uint256 tokenId)"
])

const encodeTransferFrom = (ERC721ContractAddress, from, to, tokenId) => {
  return interface.encodeFunctionData("transferFrom", [ERC721ContractAddress, from, to, tokenId]);
}
const encodeTransferFromReplacement = (isBuyer) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let functionReplacement = '0x00000000';
  let paramsReplacement;
  if(isBuyer){
    paramsReplacement = abiCoder.encode(['address', 'bytes32', 'address', 'uint256'], [ZERO_ADDRESS, REPLACEMENT, ZERO_ADDRESS, ZERO_ADDRESS])
  } else {
    paramsReplacement = abiCoder.encode(['address', 'address', 'bytes32', 'uint256'], [ZERO_ADDRESS, ZERO_ADDRESS, REPLACEMENT, ZERO_ADDRESS])
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
  encodeTransferFrom: encodeTransferFrom,
  encodeTransferFromReplacement: encodeTransferFromReplacement
}

module.exports = Utils;