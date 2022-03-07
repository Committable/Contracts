# Committable-contracts

20211215更新日志

Committable deployed to: **0xaeb676387E1Af4D71A258aD31D6Fd6cd1eC554C9**

Controller deployed to: **0x82D477c25dbFC5238dB0e0C680b15E816EA8721C**

CommittableV1 deployed to: 0x2ceDC191d4bDE246e72af86E5c66EbAD9Ed16968

Exchange deployed to: **0xe2b473735C828AFb208fBbFDCABf1AB10057a9B1**

Help: 0xb606d030aC9AFCdc5f37fA8e38049304F453427e

1. 订单结构增加字段target，构造订单时该值始终输入Committable合约地址

```javascript
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
```

2. 对hashOrder函数进行调整

```javascript
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
```

3. 交易转账CMT时，数据编码encodeTransfer替代encodeTransferWithPermit（以及对应的replacement）

```javascript
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
```

4. 修改encodeMintWithSig函数

```javascript
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

```

5. 修改interface

```javascript
const interface = new ethers.utils.Interface([
  "function mint(address to, uint256 tokenId, bytes signature)",
  "function transferFrom(address from, address to, uint256 tokenId)",
])
```

6. 移除签名转账功能

交易已上链的CMT流程更正为：

1. 检查该卖家是否是第一次出售，如果是则先调用controller合约的registerRouter()函数

   ```javascript
   	// 查询卖家地址是否有创建过router，如果没有则发起交易创建router；
     // 如果没未创建过router，getRouter返回0地址
   		let router = await controller.getRouter(seller.address);
   		// 卖家第一次出售，调用合约创建router
   		if (router == ZERO_ADDRESS) {
       tx = await controller.connect(seller).registerRouter();
       await tx.wait();
     }
   		// getRoute()返回值不是0地址表示该卖家已有router，可以创建订单并转账
   ```

2. 卖家创建router后，再构造订单并签名，订单示例参考技术文档（已更新）