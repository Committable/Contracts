
const { ethers } = require('hardhat');

const timeTravel = function (time) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [time], // 86400 is num seconds in day
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    });
  })
}



const Asset = class {
  constructor(assetClass, contractAddress, value) {
    this.assetClass = assetClass;
    this.contractAddress = contractAddress;
    this.value = value;
  }
}
const hashAsset = (asset) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let asset_encode =
    abiCoder.encode(['bytes4', 'address', 'uint256'], [asset.assetClass, asset.contractAddress, asset.value])
  return asset_hash = ethers.utils.keccak256(asset_encode);
}

const Order = class {
  constructor(exchange, isBuySide, isAuction, signer, buySideAsset, sellSideAsset, royalty, salt, start, end) {
    this.exchange = exchange;
    this.isBuySide = isBuySide;
    this.isAuction = isAuction;
    this.signer = signer;
    this.buySideAsset = buySideAsset;
    this.sellSideAsset = sellSideAsset;
    this.royalty = royalty;
    this.salt = salt;
    this.start = start;
    this.end = end;
  }
}
const hashOrder = (order) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let order_encode =
    abiCoder.encode(['address', 'bool', 'bool', 'address', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256'],
      [order.exchange, order.isBuySide, order.isAuction, order.signer,
      hashAsset(order.buySideAsset), hashAsset(order.sellSideAsset), order.royalty,
      order.salt, order.start, order.end]
    );

  return order_hash = ethers.utils.keccak256(order_encode);
}

const Utils = {
  Asset: Asset,
  hashAsset: hashAsset,
  Order: Order,
  hashOrder: hashOrder,
}

module.exports = Utils;