# Committable Docs - Smart Contracts

## Overview

Committable smart contracts enable software developers to tokenize their contributions (the **’commit‘**) to open source projects in the form of ERC721 and provide flexible and secure protocols for trading and bringing rewards with them.

### 合约概要

- Exchange：负责交易订单匹配和执行（订单交易CMT，订单交易未上链的CMT）
- Committable：CMT的ERC721合约，非订单交易行为可以调用该合约进行转账和铸币
- Payroll:：负责创建和领取payroll
- Router：用户代理转账地址
- CommittableV1：CMT的逻辑合约V1版，通过Transparent Proxy实现CMT的逻辑可更新性，该合约仅提供访问逻辑
- Controller：负责各合约的参数管理和管理用户Router合约，当前该合约管理权限为EOA账号
- Helper：提供批量查询和哈希查询接口，主要用于Debug

![流程图 (1)](/Users/aolin/Projects/committable-contracts/docs/details/architecture.jpg)

### 合约地址(Ropsten)

- **Payroll**

  0x55c72CE0B3BA067fAfFF43126e5f56992148e8Df

- **Exchange**

  0xB976678B0dA3F1632A2E442325c9eB8CB9E00BdC

- **Committable**

  0x569Acd67399A90c2b04B49b93E6ed07bE4751255

- **Helper**

  0xb606d030aC9AFCdc5f37fA8e38049304F453427e

- **CommittableV1**

  0x1Be89BfB9aca45A2008608BB4bEa341BEA57dE11

- **Controller**

  0x82D477c25dbFC5238dB0e0C680b15E816EA8721C

### EOA地址

- Exchange & Controller合约管理员地址: 0xaa3376682A0fF472c716E23927D4200DB69E8A9C
- Reserve地址:：0xaa3376682A0fF472c716E23927D4200DB69E8A9C
- 铸币签名地址：0x95EC7c60F2150cb9CCdbc942278CfD71f0a47024

## Contracts

### Committable

Committable is an ERC721 upgradeable token contract with transparent proxy pattern. 

#### Rationale

##### 编号规则

为减少gas消耗，合约利用tokenId来存储CMT的commit信息和所属项目。tokenId是256bits的整型数据，其中：前96bits (12bytes)存储该CMT所属的项目，后160bits (20bytes)存储该CMT对应的commit哈希，并提供相应的函数访问这些值。

```javascript
let projectId = '0xaaaaaaaa';
let commitHash = '0x041d9634c70ef59d320cc1224a6e46a46ea7de58';
let tokenId = '0xaaaaaaaa041d9634c70ef59d320cc1224a6e46a46ea7de58';
```

##### 铸币签名

Committable为mint函数添加了签名验证，铸币者必须通过app获得**服务器端签名**才能进行铸币行为

服务器对铸币签名对象为： 铸币地址（创作者）+ tokenId，进行abi编码的keccak256哈希结果

```javascript
// 
const hashMint = (creator, tokenId) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let mint_encode =
    abiCoder.encode(['address', 'uint256'], [creator, tokenId])
    return mint_hash = ethers.utils.keccak256(mint_encode);
}
// creator_address= 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
// tokenId = 0xaaaaaaaa041d9634c70ef59d320cc1224a6e46a46ea7de58
// mint_encode = 0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000aaaaaaaa041d9634c70ef59d320cc1224a6e46a46ea7de58
// mint_hash = keccak256(mint_encode)
let signature_0 = await seller.signMessage(ethers.utils.arrayify(hashMint(seller.address, tokenId_0)));
```

调用铸币相关接口时，用户调用传入tokenId和对应的签名即可完成铸币

#### Functions (Read-Only)

##### balanceOf(owner)

查询指定地址的代币余额

**输入**

1. `owner` - `地址`：查询地址

**输出**

`balance` -`uint256`：地址拥有的余额

##### ownerOf(tokenId)

查询指定代币的所有者

**输入**

1. `tokenId` - `uint256`：代币编号

**输出**

`owner` - `地址`：代币拥有者地址

##### name()

查询合约代币名称。

**输出**

`name` - `字符串`：合约代币名称

##### symbol()

查询代币合约符号

**输出**

`symbol` - `字符串`：合约代币符号

##### tokenURI(tokenId)

查询指定代币的URI, 当前返回的代币URI是："https://app.committable.io/nft/\<tokenId>"

**输入**

1. `tokenId` - `uint256`：指定代币编号

**输出**

`URI` - `字符串`：指定代币链接

##### totalSupply()

查询代币总量

**输出**

`totalSupply` - `uint256`：代币总量

##### tokenByIndex(index)

根据索引查询代币编号

> 索引值从0计数，小于代币总量

**输入**

1. `index` - `uint256`：代币索引

**输出**

`tokenId` - `uint256`：代币编号

##### tokenOfOwnerByIndex(owner, index)

根据索引和代币所有者地址查询代币编号

> 索引值从0计数，小于用户余额

**输入**

1. `owner` - `地址`：所有者
2. `index` - `uint256`：代币索引

**输出**

`tokenId` - `uint256`：代币编号

##### projectOf(tokenId)

查询指定代币所属项目

**输入**

1. `tokenId` - `uint256`：指定代币编号

**输出**

`project` - `uint96`：代币所属项目

##### tokenOfProjectByIndex(project, index)

根据索引和项目名查询代币编号

> 索引值从0计数

**输入**

1. `project` - `uint96`：指定项目名
2. `index` - `uint256`：代币索引

**输出**

`tokenId` - `uint256`：代币编号

##### totalSupplyOfProject(project)

查询指定项目代币数量

**输入**

1. `project` - `uint96`：指定项目名

**输出**

`totalSupply` - `uint256`：代币数量

##### commitOf(tokenId)

查询指定代币的commit哈希值

**输入**

1. `tokenId` - `uint256`：代币编号

**输出**

`commitHash` - `uint160`：代币对应的commit哈希值

**nonces(address)**

查询指定地址当前的nonce值

**输入**

1. `address` - `address`：查询地址

**输出**

`nonce` - `uint256`：对应地址的nonce值，该nonce值将用于签名授权

#### Functions (State-Changing)

##### approve(operator, tokenId)

授权指定地址对应tokenId的使用权

**输入**

1. `operator` - `地址`：获得授权的地址
2. `tokenId` - `uint256`：代币编号

**释放事件**

1. Approval

##### setApprovalForAll(operator, bool)

授权指定地址对授权者所有token的使用权

**输入**

1. `operator` - `地址`：获得授权的地址
2. `bool` - `布尔值`：是否授权

**释放事件**

1. ApprovalForAll

##### transferFrom(from, to tokenId)

对指定编号的ERC721代币发起转账

**输入**

1. `from` - `地址`：代币来源地址
2. `to` - `地址`：代币收款地址
3. `tokenId` - `uint256`：代币编号

**释放事件**

1. Transfer

##### mint(to, tokenId, signature)

铸造指定代币编号的代币

> 具体tokenId编号规则和铸币签名规则参考Rationale

**输入**

1. `to` - `地址`：代币收款地址
2. `tokenId` - `uint256`：代币编号
3. `signature` - `bytes`：代币签名

**释放事件**

1. Transfer

##### mintAndTransfer(creator, to, tokenId, signature)

铸币并完成一次转账

> 具体授权签名规则参考Rationale

**输入**

1. `creator` - `地址`：创建者地址
2. `to` - `地址`：接受者地址
3. `tokenId` - `uint256`：代币编号
4. `signature` - `bytes`：代币签名

#### Event

##### Transfer(indexed from, indexed to, indexed tokenId)

**输入**

1. `from` - `地址`：代币发送者，新铸代币代币发送者地址是以太坊0地址
2. `to` - `地址`：代币收款者
3. `tokenId` - `整型`：代币编号

##### Approval(indexed owner, indexed approved, indexed tokenId)

**输入**

1. `owner` - `地址`：代币拥有者
2. `approved` - `地址`：获得授权的地址
3. `tokenId` - `整型`：代币编号

##### ApprovalForAll(indexed owner, indexed approved, bool)

**输入**

1. `owner` - `地址`：代币拥有者
2. `approved` - `地址`：获得授权的地址
3. `bool` - `布尔值`：获得授权与否

### Exchange

#### Rationale

##### 订单结构

订单结构体定义如下

```solidity
 struct Order {
        // exchange address to execute orders
        address exchange;
        // order side: true for order from buyer, false for order from seller
        bool isBuySide;
        // order transaction type
        bool isAuction;
        // order maker address
        address maker;
        // // paymentToken contract address, zero-address as sentinal value for ether
        address paymentToken;
        // paymentToken amount that a buyer is willing to pay, or a seller's minimal ask price
        uint256 value;
        // royalty address to pay
        address royaltyRecipient;
        // royalty to pay, zero as non-royalty
        uint256 royalty;
        // target to call
        address target;
        // attached calldata to target
        bytes data;
        // data replacement pattern, empty bytes for no replacement;
        bytes replacementPattern;
        // timestamp for the starting time for executing this order
        uint256 start;
        // timestamp for the deadline for executing this order
        uint256 end;
        // randomize order hash
        uint256 salt;
    }

```

其中：

- exchange代表当前正在使用的交易合约地址；
- isBuySide是布尔值，true代表买方订单，false代表卖方订单
- isAuction是布尔值，true代表订单拍卖类型，false代表订单是定价出售
- maker是订单发起人地址
- paymentToken指支付代币的合约地址，该值设置为以太坊0地址代表用ETH进行支付
- value值指实际支付数量
- royaltyRecipient指该笔交易的版权费接受地址（从当前版本开始，合约不再记录版权费和创作者信息，依赖外部参数输入）
- royalty指版权费的万分比（该值设置为500时指版权费收取5%，有效值在0-10000之间）
- address是该笔交易完成后外部调用目标
- data是该笔交易完成后发生的外部调用数据（转账NFT或者进行延迟铸币等操作，在数据编码中会详细介绍）
- replacementPattern表示外部调用数据的匹配规则（转账NFT或者进行延迟铸币等操作，在数据编码中会详细介绍）
- start：该订单有效起始时间戳（秒）：设置成0表示即可生效
- end：该订单有效截止时间戳（秒）：设置成0表示永久有效
- salt：随机值：用来区分内容一致的订单

##### 数据编码与订单类

数据编码指对外部调用数据的编码，当前包含transferWithPermit与mintWithSig函数

```javascript
// 初始化常量
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const NON_REPLACEMENT = '0x0000000000000000000000000000000000000000000000000000000000000000';
const REPLACEMENT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const SIG = '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
// 从hardhat载入ethers.js，web可以从metamask载入ethers.js
// const { ethers } = require('hardhat');
// 初始化abi
const interface = new ethers.utils.Interface([
  "function mint(address creator, uint256 tokenId, bytes signature)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function mintAndTransfer(address creator, address to, uint256 tokenId, bytes signature)"
])
// 对调用transfer进行编码，其中encodeTransfer传入调用参数，Replacement传入买卖方布尔值
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
// 对调用encodeMintAndTransdfer进行编码，其中encodeMintAndTransfer传入调用参数，Replacement传入买卖方布尔值
const encodeMintAndTransfer = (creator, to, tokenId, signature = SIG) => {
  return interface.encodeFunctionData("mintAndTransfer", [creator, to, tokenId, signature]);

}

const encodeMintAndTransferReplacement = (isBuyer) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let functionReplacement = '0x00000000';
  let paramsReplacement;
  if (isBuyer) {
    paramsReplacement = abiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT])
  } else {
    paramsReplacement = abiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [NON_REPLACEMENT, REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT])
  }
  return ethers.utils.hexConcat([functionReplacement, paramsReplacement]);
}
// 订单结构体
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
// 订单哈希函数
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
// export

const Utils = {
  Order: Order,
  hashOrder: hashOrder,
  hashMint: hashMint,
  encodeMintAndTransfer: encodeMintAndTransfer,
  encodeMintAndTransferReplacement: encodeMintAndTransferReplacement,
  encodeMintWithSig: encodeMintWithSig,
  encodeMintWithSigReplacement: encodeMintWithSigReplacement,
  encodeTransfer: encodeTransfer,
  encodeTransferReplacement: encodeTransferReplacement
}

module.exports = Utils;
```

##### 订单构造示例

**支付ETH购买已铸造的CMT（定价出售）**

```javascript
// 用ETH支付的买单，购买已经完成铸币的CMT
buy_order_0 = new Order(
        exchange.address, // 当前交易所地址
        true, // true指买方
  			false, // false指定价出售
        buyer.address, // 该订单的发起地址，既买家地址
        ZERO_ADDRESS, // 支付货币的合约地址，此处输入0地址代表以太坊
        PRICE, // 支付、接受价格；要求买单价格大于卖方价格，最后以买单价格执行
        royaltyRecipient.address, // 创作者地址
        0, // 版权费万分比，设置为0代表不收取版权费
  			committable.address // 外部调用地址，即nft地址
        encodeTransfer(ZERO_ADDRESS, buyer.address, tokenId_0),
  			// 对交易转账行为进行编码TransferWithPermit，三个参数分别指：
  			// nft卖家地址，即from地址，此处设置为0，卖方不关心卖家地址
  			// nft买家地址，即to地址，此处设置成买方自己的地址
  			// 代币编号
        encodeTransferReplacement(true),
  			// 对交易转账行为制定替代规则，参数true指此处是买方编码
        0, //起始时间戳
        0, //截止时间戳（设置成0指无截止时间）
        Math.floor(Math.random() * 10000) //随机值
      )

   		// 查询卖家地址是否有创建过router，如果没有则发起交易创建router；
      // 如果没未创建过router，getRouter返回0地址
			let router = await controller.getRouter(seller.address);
			// 卖家第一次出售，调用合约创建router
			if (router == ZERO_ADDRESS) {
        tx = await controller.connect(seller).registerRouter();
        await tx.wait();
      }

      sell_order_0 = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        0,
        committable.address
        encodeTransfer(seller.address, ZERO_ADDRESS, tokenId_0),
        // seller.address：卖方地址，即卖单提交者地址
        // ZERO_ADDRESS：买方地址，卖方此处不关心买方地址
        // tokenId_0：出售的代币编号
        encodeTransferReplacement(false),
        // 对交易转账行为制定替代规则，参数false指此处是卖方编码
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
			// 计算两个订单的哈希值（hashOrder），分别让用户对订单哈希进行签名
      buy_order_sig_0 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_0)));
      sell_order_sig_0 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_0)));
```

**支付ETH购买还未铸造的CMT**

```javascript
// 对tokenId进行签名，签名由服务器端完成和提供   
let abiCoder = new ethers.utils.AbiCoder();
let signature_4 = await seller.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_4])));
// 构造买单，支付ETH购买未上链的CMT
      buy_order_4 = new Order(
        exchange.address,
        true,
        false,
        buyer.address,
        ZERO_ADDRESS,
        PRICE,
        ZERO_ADDRESS,
        0,
        committable.address，
        encodeMintAndTransfer(seller.address, buyer.address, tokenId_4, signature_4),
        // 对铸币行为进行编码MintWithSig，四个参数分别为：
        // 卖方地址
        // 买方地址
        // 代币编号
        // 铸币签名
        encodeMintAndTransferReplacement(true),
        // 对铸币行为制定替代规则，参数true指此处是买方编码
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_4 = new Order(
        exchange.address,
        false,
        false,
        seller.address,
        ZERO_ADDRESS,
        PRICE,
        ZERO_ADDRESS,
        0,
        committable.address，
        encodeMintAndTransfer(seller.address ZERO_ADDRESS, tokenId_4, signature_4), // 卖方不关心买家地址
        // 对铸币行为进行编码encodeMintAndTransfer，四个参数分别为：
        // 卖方地址
        // 买方地址
        // 代币编号
        // 铸币签名（由服务器完成签名，并提供给前端）
        encodeMintAndTransferReplacement(false),
        // 对铸币行为制定替代规则，参数false指此处是卖方编码
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
				// 两笔订单分别让用户进行签名
 buy_order_sig_4 = await buyer.signMessage(ethers.utils.arrayify(hashOrder(buy_order_4)));
 sell_order_sig_4 = await seller.signMessage(ethers.utils.arrayify(hashOrder(sell_order_4)));
```

#### Function (Read-Only)

##### checkOrderStatus(orderHash)

查询订单状态

**输入**

1. `orderHash` - `字节码`：订单哈希

**输出**

1. `布尔值` - `bool`：订单是否有效

##### checkOrderStatusBatch(orderHashs)

批量查询订单状态

**输入**

1. `orderHashs` - `字节码数组`：订单哈希数组

**输出**

1. `布尔值数组` - `bools`：订单是否有效-布尔值数组

#### Function (State-Changing)

##### matchOrder(buyOrder, buyOrderSig, sellOrder, sellOrderSig)

匹配订单

> 具体订单结构和编码方式参考Exchange Rationale

**输入**

1. `buyOrder` - `结构体`：买单信息
2. `buyOrderSig` - `字节码`：买单签名
3. `sellOrder` - `结构体`：卖单信息
4. `sellOrderSig` - `字节码`：卖单签名

**事件触发**

1. `OrderMatched` - `Exchange合约`
1. `Transfer`- `Committable合约`
3. `Transfer`- `其他ERC20代币合约`（当使用ERC20代币购买CMT时会触发该事件，使用ETH不会）

##### cancelOrder(order)

取消订单，之后若执行该订单合约会抛错

**输入**

1. `order` - `结构体`：订单信息

**事件触发**

1. `OrderCancelled`- `Exchange合约`

#### Event

##### OrderMatched(buyOrderHash, sellOrderHash, indexed buyer, indexed seller, paymentToken, value)

**输入**

1. `buyOrderHash` - `字节码`：买单哈希
2. `sellOrderHash` - `字节码`：卖单哈希
3. `buyer` - `地址`：买方地址
4. `seller` - `地址`：卖方地址
5. `paymentToken` - `地址`：支付货币合约地址
6. `value` - `uint256`：支付数量

##### OrderCancelled(orderHash, indexed maker)

**输入**

1. `orderHash` - `字节码`：订单哈希
2. `maker` - `地址`：订单取消人

### Helper

Helper contract enables batch requests and debug functions

#### Functions (Read-Only)

##### hashOrder(order)

对订单结构体进行哈希计算，可以对app的哈希结果进行对比检查

**输入**

1. `order` - `结构体`：订单结构体

**输出**

1. `orderHash` - `字节码`：订单对应的哈希结果

##### recover(hash, sig)

根据原始签名信息和签名结果还原签名地址，可以对app端的签名结果（铸币签名，转账授权签名和订单签名）进行检查

**输入**

1. `hash` - `字节码`：原始签名哈希
2. `sig` - `字节码`：签名结果

**输出**

1. `地址` - `address`：还原的签名地址

##### tokenOfOwnerByIndexBatch(token, owner, indexes)

批量查询目标ERC721合约地址，指定拥有者所拥有的代币

**输入**

1. `token` - `地址`：ERC721合约地址，即Committable合约地址
2. `owner` - `地址`：查询目标地址
3. `indexes` - `整型数组`：从0开始的索引数组（index值必须小于用户持有总量）

**输出**

1. `tokenIds` - `整型数组`：用户持有的代币编号数组

##### tokenByIndexBatch(token, indexes)

批量查询目标ERC721合约地址的代币

**输入**

1. `token` - `地址`：ERC721合约地址，即Committable合约地址

2. `indexes` - `整型数组`：从0开始的索引数组（index值必须小于代币总量）

   **输出**

1. `tokenIds` - `整型数组`：代币编号数组

### Router

Router contract forwards external calls to Committable contract, only accessbie for approved address (managed by controller)

#### Functions (Read-Only)

##### user()

查询router的拥有者

**输出**

1. `owner` - `地址`：拥有者地址

##### controller()

查询controller地址

**输出**

1. `controller` - `地址`：controller地址

#### Function (State-Changing)

##### proxy(target, data)

对目前合约发起调用

> 仅被授权的地址和router拥有者地址可以调用该方法

**输入**

1. `target` - `地址`：调用目标地址
6. `data` - `bytes`：调用数据

### Controller

Controller contract is the owner of other contracts and is designed to responsible for router registration and exchange authentication

#### Functions (Read-Only)

##### getRouter(user)

查询对应用户的router地址

**输入**

1. `user` - `地址`：用户地址

**输出**

1. `router` - `地址`：该用户的router地址

##### getSigner()

查询签名地址

**输出**

1. `signer` - `地址`：签名地址

##### isApproved(exchange)

查询对应地址是否被授权访问router

**输入**

1. `exchange` - `地址`：查询地址

**输出**

1. `bool` - `布尔值`

#### Function (State-Changing)

##### registerRouter()

注册router地址

**释放事件**

1. RouterRegistered

##### setSigner(signer)

设置签名地址

> 仅管理员可调用

**输入**

1. `signer` - `地址`：签名地址

##### approveOrCancel(exchange, bool)

授权或取消授权

> 仅管理员可调用

**输入**

1. `exchange` - `地址`：授权地址
2. `bool` - `布尔值`

**释放事件**

ExchangeApprovedOrCancelled()

#### Event

##### RouterRegistered(indexed user, indexed router)

**输入**

1. `user` - `地址`：用户地址
2. `router` - `地址`：注册的router地址

##### ExchangeApprovedOrCancelled (indexed exchange, bool authorized)

**输入**

1. `exchange` - `地址`：获得授权的地址
2. `authorized` - `布尔值`

### Payroll

Payroll contract allows creating payroll based on ERC20 token, it relies on ECDSA signature verification when users try to claim the rewards

#### Functions (Read-Only)

##### getPoolInfo (index)

查询对应编号的payroll数据

**输入**

1. `index` - `整型`：payroll编号

**输出**

1. `poolInfo` - `结构体`：pool结构体

```solidity
  struct PoolInfo {
        address creator;
        IERC20 rewardToken;
        uint256 rewardAmount;
        uint256 unclaimedAmount;
        uint256 start;
        uint256 end;
    }
```

##### getUserInfo (index, user)

查询用户是否已经领取对应编号的payroll

**输入**

1. `index` - `整型`：payroll编号
2. `user` - `地址`：用户地址

**输出**

1. `bool` - `布尔值`：已经领取返回true

#### Function (State-Changing)

##### create(index, rewardToken, rewardAmount, start, end)

创建新的payroll

**输入**

1. `index` - `整型`：payroll编号
2. `rewardToken` - `整型`：payroll编号
3. `rewardAmount` - `整型`：payroll编号
4. `start` - `整型`：payroll编号
5. `end` - `整型`：payroll编号

**释放事件**

1. PoolCreated()

##### claim(index. amount, sig)

领取payroll

**输入**

1. `index` - `整型`：payroll编号
2. `amount` - `整型`：payroll金额
3. `sig` - `字节码`：签名数据

**释放事件**

1. RewardClaimed()

##### withdraw(index)

领取剩余未领取payroll

> 仅payroll创建在payroll有效期过后可调用

**输入**

1. `index` - `整型`：payroll编号

**释放事件**

1. RewardClaimed()

#### Event

##### PoolCreated(indexed index, indexed rewardToken, rewardAmount, indexed creator, start, end)

**输入**

1. `index` - `整型`：payroll编号
2. `rewardToken` - `地址`：奖励token的合约地址
3. `rewardAmount` - `整型`：奖励总金额
4. `creator` - `地址`：payroll创建者
5. `start` - `整型`：payroll开始时间
6. `end` - `整型`：payroll结束时间

#####   RewardClaimed(indexed index,indexed rewardToken,rewardAmount,indexed user）

**输入**

1. `index` - `整型`：payroll编号
2. `rewardToken` - `地址`：奖励token的合约地址
3. `rewardAmount` - `整型`：奖励金额
4. `user` - `地址`：奖励领取地址

##### 
