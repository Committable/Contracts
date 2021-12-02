# Committable Docs - Smart Contracts

## Overview

Committable smart contracts enable software developers to tokenize their contributions (the **’commit‘**) to open source projects in the form of ERC721 and provide flexible and secure exchange protocols for trading them.

### 合约概要

- **Exchange：负责交易订单匹配和执行（订单交易CMT，订单交易未上链的CMT）**
- **Committable：CMT的ERC721合约，非订单交易行为可以调用该合约进行转账和铸币**
- Helper：提供批量查询和哈希查询接口，主要用于Debug
- Router：负责合并授权和转账
- CommittableV1：CMT的逻辑合约V1版，通过Transparent Proxy实现CMT的逻辑可更新性，该合约仅提供访问逻辑
- Controller：负责各合约的参数调整和管理用户Router合约，仅管理员地址可以调用该合约

### 合约地址(Ropsten)

- **Exchange**：

  ~~0xC042025a4f72d8CCb6C0ce558d98bA2a134f8a24~~

  **0xB15F0d2e4a7416bdf9bb766a6ff2aB704A5E0392** (Updated at 2nd Dec)

- **Committable**：

  ~~0xAa30D69a35d9BC2c3f59949b96efeEfBD84BBC27~~

  **0x2b9059EB406254c71aB9c0F90FB3be638a1147b4** (Updated at 2nd Dec)

- Helper：**0x67886c1203aAFC191Cbf878454D73b2825783dd1**

- Router：

  ~~0xaA9cDB8106B3c25E4e604C039a2bD966A6B42622**~~**

  **0x7759f72A371debC182208024A3D33E287e799527** (Updated at 2nd Dec)

- CommittableV1：

  ~~0xF326F9dd019dCE7864C1e2d295eD1a57fC1F7205~~

  **0xF1DA55A6026D6fdddc88F73e45CB4cA35c034b3E** (Updated at 2nd Dec)

- Controller：

  ~~0xB90EDA1295e35115D19a138cdC3A697D59eD87b0~~

  **0x8553357ab4aD7f7fBBF6b7A490A88dAa3b4870f6** (Updated at 2nd Dec)

### 管理地址

- Exchange & Controller合约管理员地址: 0xaa3376682A0fF472c716E23927D4200DB69E8A9C
- Reserve地址:：0x92E0a5c7d7D806cD48Db15e220DC4440185b0787
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

具体签名规则如下：

```javascript
// 对tokenId进行签名
let tokenId = '0xaaaaaaaa041d9634c70ef59d320cc1224a6e46a46ea7de58';
// 对tokenId进行编码（不足32字节部分补上0）
// raw_data = '0x0000000000000000aaaaaaaa041d9634c70ef59d320cc1224a6e46a46ea7de58'
let raw_data = ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId]));
// 调用服务器存储的私钥对该raw值签名（注意数据类型，该处应是对hex签名，而非string），该私钥对应的公钥将存储在Controller合约中（可以更新）
let signature = await signer.signMessage(raw_data);
// 通过geth客户端签名时，实际签名内容是keccak256("\x19Ethereum Signed Message:\n32" + raw_data)，合约内部在验签时会自动加上该签名前缀并进行一次哈希运算
```

签名完成后，用户调用mint函数传入tokenId和对应的签名即可完成铸币

##### 授权签名

合约提供了额外的授权函数，可以传入代币拥有者的授权签名，通过第三方调用来完成代币授权（因此在Router合约中使得将授权和转账合并到一个原子交易成为可能）

具体签名规则如下：

```javascript
// 封装函数，对所需参数进行编码并哈希成原始签名数据(raw_data)
// signer.address: 授权者地址，代币拥有者
// operator: 授权到的地址，目前统一授权到router合约地址
// tokenId; 授权的代币编号
// nonce: nonce指，同一个nonce只能用一次，可以调用Committable合约nonce(address)来获取可用nonce指
// deadline：授权有效截止时间戳(秒)，当该值设为0时表示永久有效
const hashPermit = (operator, tokenId, nonce, deadline) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let permit_encode =
    abiCoder.encode(['address', 'uint256', 'uint256', 'uint256'], [operator, tokenId, nonce, deadline])
  return permit_hash = ethers.utils.keccak256(permit_encode);
}
// 访问signer地址对应nonce值
let nonce = await committable.nonces(signer.address);
// 用signer地址进行授权签名，允许user地址使用该tokenId（signer必须是该tokenId的所有者）
let permit_sig = await signer.signMessage(ethers.utils.arrayify(hashPermit(user.address, tokenId, nonce, 0)));
```

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

##### permit(operator, tokenId, deadline, signature)

签名授权指定地址对指定代币的使用权

> 具体授权签名规则参考Rationale

**输入**

1. `operator` - `地址`：授权地址
2. `tokenId` - `uint256`：代币编号
3. `deadline` - `uint256`：授权截止时间戳（秒）
4. `signature` - `bytes`：授权签名

#### Event

##### Transfer(indexed from, indexed to, indexed tokenId)

**输入**

1. `from` - `地址`：代币发送者，新铸代币代币发送者地址是以太坊0地址
2. `to` - `地址`：代币收款者
3. `tokenId` - `整型`：代币编号

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
        // order maker address
        address maker;
        // order taker address, if specified
        address taker;
        // paymentToken contract address, zero-address as sentinal value for ether
        address paymentToken;
        // paymentToken amount that a buyer is willing to pay, or a seller's minimal ask price
        uint256 value;
        // royalty address to pay
        address royaltyRecipient;
        // royalty to pay, zero as non-royalty
        uint256 royalty;
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
- maker是订单发起人地址
- taker是订单接收人地址，把taker值设置为以太坊0地址代表任意地址均可以匹配该订单
- paymentToken指支付代币的合约地址，该值设置为以太坊0地址代表用ETH进行支付
- value值指实际支付数量
- royaltyRecipient指该笔交易的版权费接受地址（从当前版本开始，合约不再记录版权费和创作者信息，依赖外部参数输入）
- royalty指版权费的万分比（该值设置为500时指版权费收取5%，有效值在0-10000之间）
- data是该笔交易完成后发生的外部调用数据（转账NFT或者进行延迟铸币等操作，在数据编码中会详细介绍）
- replacementPattern表示外部调用数据的匹配规则（转账NFT或者进行延迟铸币等操作，在数据编码中会详细介绍）
- start：该订单有效起始时间戳（秒）：设置成0表示即可生效
- end：该订单有效截止时间戳（秒）：设置成0表示永久有效

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
  "function mint(address to, uint256 tokenId, bytes signature)",
  "function transferFrom(address token, address from, address to, uint256 tokenId)",
  "function transferWithPermit(address token, address from, address to, uint256 tokenId, uint256 deadline, bytes signature)",
  "function mintWithSig(address token, address to, uint256 tokenId, bytes signature)"
])
// 对调用transferWithPermit进行编码，其中encodeTransferWithPerimit传入调用参数，Replacement传入买卖方布尔值
const encodeTransferWithPermit = (ERC721ContractAddress, from, to, tokenId, deadline = 0 , signature = SIG) => {
  return interface.encodeFunctionData("transferWithPermit", [ERC721ContractAddress, from, to, tokenId, deadline, signature]);
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
// 对调用encodeMintWithSig进行编码，其中encodeMintWithSig传入调用参数，Replacement传入买卖方布尔值
const encodeMintWithSig = (ERC721ContractAddress, to, tokenId, signature = SIG) => {
  return interface.encodeFunctionData("mintWithSig", [ERC721ContractAddress, to, tokenId, signature]);
}
const encodeMintWithSigReplacement = (isBuyer) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let functionReplacement = '0x00000000';
  let paramsReplacement;
  if (isBuyer) {
    paramsReplacement = abiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT])
  } else {
    paramsReplacement = abiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [NON_REPLACEMENT, REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT, NON_REPLACEMENT])
  }
  return ethers.utils.hexConcat([functionReplacement, paramsReplacement]);
}
// 订单类
const Order = class {
  constructor(exchange, isBuySide, maker, taker, paymentToken, value, royaltyRecipient, royalty, data, replacementPattern, start, end, salt) {
    this.exchange = exchange;
    this.isBuySide = isBuySide;
    this.maker = maker;
    this.taker = taker;
    this.paymentToken = paymentToken;
    this.value = value;
    this.royaltyRecipient = royaltyRecipient;
    this.royalty = royalty;
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
    abiCoder.encode(['address', 'bool', 'address', 'address', 'address', 'uint256', 'address', 'uint256', 'bytes', 'bytes', 'uint256', 'uint256', 'uint256'],
      [order.exchange, order.isBuySide, order.maker, order.taker,
      order.paymentToken, order.value, order.royaltyRecipient, order.royalty, order.data, order.replacementPattern,
      order.start, order.end, order.salt]
    );
  return order_hash = ethers.utils.keccak256(order_encode);
}
// 转账授权哈希
const hashPermit = (operator, tokenId, nonce, deadline) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let permit_encode =
    abiCoder.encode(['address', 'uint256', 'uint256', 'uint256'], [operator, tokenId,nonce, deadline])
  return permit_hash = ethers.utils.keccak256(permit_encode);
}

const Utils = {
  Order: Order,
  hashOrder: hashOrder,
  hashPermit: hashPermit,
  encodeTransferWithPermit: encodeTransferWithPermit,
  encodeTransferWithPermitReplacement: encodeTransferWithPermitReplacement,
  encodeMintWithSig: encodeMintWithSig,
  encodeMintWithSigReplacement: encodeMintWithSigReplacement
}

module.exports = Utils;
```

##### 订单构造示例

**支付ETH购买已铸造的CMT**

```javascript
// 用ETH支付的买单，购买已经完成铸币的CMT
buy_order_0 = new Order(
        exchange.address, // 当前交易所地址
        true, // true指买方
        buyer.address, // 该订单的发起地址，既买家地址
        ZERO_ADDRESS, // 该订单的接受地址，此处输入0地址代表不指定接受者
        ZERO_ADDRESS, // 支付货币的合约地址，此处输入0地址代表以太坊
        PRICE, // 支付、接受价格；要求买单价格大于卖方价格，最后以买单价格执行
        royaltyRecipient.address, // 创作者地址
        0, // 版权费万分比，设置为0代表不收取版权费
        encodeTransferWithPermit(committable.address, ZERO_ADDRESS, buyer.address, tokenId_0),
  			// 对交易转账行为进行编码TransferWithPermit，四个参数分别指：
  			// committable nft合约地址
  			// nft卖家地址，即from地址，此处设置为0，卖方不关心卖家地址
  			// nft买家地址，即to地址，此处设置成买方自己的地址
  			// 代币编号
        encodeTransferWithPermitReplacement(true),
  			// 对交易转账行为制定替代规则，参数true指此处是买方编码
        0, //起始时间戳
        0, //截止时间戳（设置成0指无截止时间）
        Math.floor(Math.random() * 10000) //随机值
      )
// 用ETH支付的卖单，购买已经完成铸币的CMT
// 获取卖方的nonce值，并对准备出售的tokenId进行授权签名，以授权合约进行转账
nonce = await committable.nonces(seller.address);
// 调用hashPermit函数，对哈希结果进行签名
// hashPermit包含以下几个参数
// router.address：授权地址，授权router合约调用CMT。
// tokenId_0：代币编号
// nonce：获取的nonce值，该值作用是为了避免签名被重复利用
// DEADLINE：授权签名的有效截止时间戳，设置成0代表不设置有效截止时间
tokenId_0_permit_sig = await seller.signMessage(ethers.utils.arrayify(hashPermit(router.address, tokenId_0, nonce, DEADLINE)));
      sell_order_0 = new Order(
        exchange.address,
        false,
        seller.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        royaltyRecipient.address,
        0,
        encodeTransferWithPermit(committable.address, seller.address, ZERO_ADDRESS, tokenId_0, DEADLINE, tokenId_0_permit_sig),
				// 对交易转账行为进行编码TransferWithPermit，六个参数分别指：
        // committable.address：CMT合约地址
        // seller.address：卖方地址，即卖单提交者地址
        // ZERO_ADDRESS：买方地址，卖方此处不关心买方地址
        // tokenId_0：出售的代币编号
        // DEADLINE：签名截止时间戳
       	// tokenId_0_permit_sig：授权签名结果
        encodeTransferWithPermitReplacement(false),
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
        buyer.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        ZERO_ADDRESS,
        0,
        encodeMintWithSig(committable.address, buyer.address, tokenId_4),
        // 对铸币行为进行编码MintWithSig，三个参数分别为：
        // committable.address：CMT合约地址
        // 买方地址
        // 代币编码
        encodeMintWithSigReplacement(true),
        // 对铸币行为制定替代规则，参数true指此处是买方编码
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
      sell_order_4 = new Order(
        exchange.address,
        false,
        seller.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        ZERO_ADDRESS,
        0,
        encodeMintWithSig(committable.address, buyer.address, tokenId_4, signature_4),
        // 对铸币行为进行编码MintWithSig，四个参数分别为：
        // committable.address：CMT合约地址
        // 买方地址
        // 代币编码
        // 铸币签名（由服务器完成签名，并提供给前端）
        encodeMintWithSigReplacement(false),
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

1. **输出**

1. `tokenIds` - `整型数组`：代币编号数组

### Router

Router contract forwards external calls to Committable contract, integrating permit & transfer in one message call.

#### Functions (Read-Only)

#### Function (State-Changing)

##### transferWithPermit(token, from, to, tokenId, deadline, signature)

调用目标ERC721代币合约，完成授权并转账（ERC721合约需支持签名授权）

> 具体授权签名规则参考Committable Rationale

**输入**

1. `token` - `地址`：调用的代币合约地址
2. `from` - `地址`：代币拥有者地址
3. `to` - `地址`：代币接收者地址
4. `tokenId` - `uint256`：代币编号
5. `deadline` - `uint256`：签名授权有效截止时间
6. `signature` - `bytes`：授权签名

##### mintWithSig(token, to, tokenId, signature)

调用目标ERC721代币合约，传入签名完成铸币

> 具体授权签名规则参考Committable Rationale

**输入**

1. `token` - `地址`：调用的代币合约地址
2. `to` - `地址`：代币接收者地址
3. `tokenId` - `uint256`：代币编号
4. `signature` - `bytes`：铸币签名

##### transferFrom(token, from, to, tokenId)

调用目标ERC721代币合约完成转账

**输入**

1. `token` - `地址`：调用的代币合约地址
2. `from` - `地址`：代币拥有者地址
3. `to` - `地址`：代币接收者地址
4. `tokenId` - `uint256`：代币编号

