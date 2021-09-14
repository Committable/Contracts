
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


const getFunctionAbi = function (abi, functionName) {
  for (let i = 0; i < abi.length; i++) {
    if (abi[i].name == functionName) {
      return abi[i];
    }
  }
  return null;
}

const hashAsset = (asset) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let asset_encode =
    abiCoder.encode(['bytes4', 'address', 'uint256'], [asset.assetClass, asset.contractAddress, asset.value])
  return asset_hash = ethers.utils.keccak256(asset_encode);
}

const hashNft = (nft) => {
  let abiCoder = new ethers.utils.AbiCoder();

  let nft_encode =
    abiCoder.encode(['address', 'uint256', 'uint256'], [nft.contractAddress, nft.tokenId, nft.patentFee]);
  return nft_hash = ethers.utils.keccak256(nft_encode);
}

const hashOrder = (order) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let order_encode =
    abiCoder.encode(['address', 'bool', 'bool', 'address', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256'],
      [order.exchange, order.isBuyer, order.isAuction, order.maker,
      hashAsset(order.buyAsset), hashNft(order.nftAsset),
      order.salt, order.start, order.end]
    );
  // web3.eth.abi.encodeParameters(
  //   ['address', 'bool', 'bool', 'address', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256'],
  //   [order.exchange, order.isBuyer, order.isAuction, order.maker,
  //   hashAsset(order.buyAsset), hashNft(order.nftAsset),
  //   order.salt, order.start, order.end]
  // );
  return order_hash = ethers.utils.keccak256(order_encode);
}

const BuyAsset = class {
  constructor(assetClass, contractAddress, value) {
    this.assetClass = assetClass;
    this.contractAddress = contractAddress;
    this.value = value;
  }
}
const NftAsset = class {
  constructor(contractAddress, tokenId, patentFee) {
    this.contractAddress = contractAddress;
    this.tokenId = tokenId;
    this.patentFee = patentFee;
  }
}
const Order = class {
  constructor(exchange, isBuyer, isAuction, maker, buyAsset, nftAsset, salt, start, end) {
    this.exchange = exchange;
    this.isBuyer = isBuyer;
    this.isAuction = isAuction;
    this.maker = maker;
    this.buyAsset = buyAsset;
    this.nftAsset = nftAsset;
    this.salt = salt;
    this.start = start;
    this.end = end;
  }
}
const CommitInfo = class {
  constructor(project, commits) {
    this.project = project;
    this.commits = commits;
  }
}
const hashCommitInfo = (commitInfo) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let commitInfo_encode =
    abiCoder.encode(['string', 'bytes20[]'], [commitInfo.project, commitInfo.commits])
  return commitInfo_hash = ethers.utils.keccak256(commitInfo_encode);
}
const Utils = {
  timeTravel: timeTravel,
  getFunctionAbi: getFunctionAbi,
  hashAsset: hashAsset,
  hashNft: hashNft,
  hashOrder: hashOrder,
  BuyAsset: BuyAsset,
  NftAsset: NftAsset,
  Order: Order,
  CommitInfo: CommitInfo,
  hashCommitInfo: hashCommitInfo
}

module.exports = Utils;