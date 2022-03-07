# Committable Contract Logs

## 20220307 - Fix Exchange Vulnerability

exchange deployed to: 0xB976678B0dA3F1632A2E442325c9eB8CB9E00BdC

```javascript
// 移除订单结构体taker字段（移除与之相关的逻辑）
// 添加isAuction字段 （false代表定价出售，true代表拍卖）

class Order {
  constructor(exchange, isBuySide, isAuction, maker, paymentToken, value, royaltyRecipient, royalty, target, data, replacementPattern, start, end, salt) {
    this.exchange = exchange;
    this.isBuySide = isBuySide;
    this.isAuction = isAuction;
    this.maker = maker;
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
    abiCoder.encode(['address', 'bool', 'bool', 'address', 'address', 'uint256', 'address', 'uint256', 'address', 'bytes', 'bytes', 'uint256', 'uint256', 'uint256'],
      [order.exchange, order.isBuySide, order.isAuction, order.maker,
      order.paymentToken, order.value, order.royaltyRecipient, order.royalty, order.target, order.data, order.replacementPattern,
      order.start, order.end, order.salt]
    );
  return order_hash = ethers.utils.keccak256(order_encode);
}
```



## 20220301 - Re-deploy ERC721 contracts as requested

****

Committable deployed to: 0xd70dc9edDf6f41aB0798951Bb5136841C1EE7c3b

CommittableV1 deployed to: 0x4d1487482B2B77CF2591F7acB4B170c95641115C

## 20220217 - Update AirdropPool contract

****

AirdropPool deployed to: 0x55c72CE0B3BA067fAfFF43126e5f56992148e8Df

## 20220126 - Update AirdropPool contract

****

AirdropPool deployed to: 0x206b78B162545a9C5216b8ef0B59D3B8792A61C8

## 20220126 - **Allow input for index as requested**

AirdropPool deployed to: 0x04fbA4D3d98ACEBB5Ba394557425e78884dDC721

## 20220217 - **Deploy AirdropPool contract**

AirdropPool deployed to: 0x55c72CE0B3BA067fAfFF43126e5f56992148e8Df

[AirdropPool Contract](./details/AirdropPool)

## 20220120 - Fix vulnerabilities for trading offchain CMT

Controller deployed to: **0xd8d5502D907E41De5ac1fA1b129812da53eF4a7a**

Committable deployed to: **0x378E528a275Cd9735837f1b14F735f88BC8661E7**

Exchange deployed to: **0x48aEe3F428D7cc41555f2FeFB2d5436849e50400**

[Details](./details/20220120 - Fix vulnerabilities for trading offchain)

## 20211225 - Enable router and remove transferWithSig

Committable deployed to: **0xaeb676387E1Af4D71A258aD31D6Fd6cd1eC554C9**

Controller deployed to: **0x82D477c25dbFC5238dB0e0C680b15E816EA8721C**

CommittableV1 deployed to: 0x2ceDC191d4bDE246e72af86E5c66EbAD9Ed16968

Exchange deployed to: **0xe2b473735C828AFb208fBbFDCABf1AB10057a9B1**

Help deployed to: 0xb606d030aC9AFCdc5f37fA8e38049304F453427e

[Details](./details/20211225 - Enable router and remove transferWithSig)
