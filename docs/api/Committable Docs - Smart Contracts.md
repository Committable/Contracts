# Committable Docs - Smart Contracts

## Overview

Committable smart contracts enable software developers to tokenize their contributions (the **’commit‘**) to open source projects in the form of ERC721 token standard and provide flexible and secure exchange protocols for trading them.

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

Committable为mint函数添加了签名验证，铸币者必须通过web端获得服务器签名才能进行铸币行为

具体签名规则如下：

```javascript
// 对tokenId进行签名
let tokenId = '0xaaaaaaaa041d9634c70ef59d320cc1224a6e46a46ea7de58';
// 对tokenId进行编码（不足32字节部分补上0）
// raw_data = '0x0000000000000000aaaaaaaa041d9634c70ef59d320cc1224a6e46a46ea7de58'
let raw_data = ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId]));
// 调用服务器存储的私钥对该raw值签名（注意数据类型，该处应是对hex签名，而非string），该私钥对应的公钥将存储在智能合约中（可以更新）
let signature = await signer.signMessage(raw_data);
```

签名完成后，用户调用mint函数传入tokenId和对应的签名即可完成铸币

##### 授权签名

合约提供了额外的授权函数，可以传入代币拥有者的授权签名，通过第三方调用来完成代币授权（因此在Router合约中使得将授权和转账合并到一个原子交易成为可能）

具体签名规则如下：

```javascript
// 封装函数，对所需参数进行编码并哈希成原始签名数据(raw_data)
// operator: 授权到的地址，目前统一授权到router合约地址
// tokenId; 授权的代币编号
// nonce: nonce指，同一个nonce只能用一次，可以调用Committable合约nonce(address)来获取可用nonce指
// deadline：授权有效截止时间戳，当该值设为0时表示永久有效
const hashPermit = (operator, tokenId, nonce, deadline) => {
  let abiCoder = new ethers.utils.AbiCoder();
  let permit_encode =
    abiCoder.encode(['address', 'uint256', 'uint256', 'uint256'], [operator, tokenId,nonce, deadline])
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

### Router

Router contract forwards external calls to Committable contract, integrating permit & transfer in one message call and providing batch request functions (TBD).

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

### Exchange

#### Rationale

##### 订单结构

##### 数据编码

#### Function (Read-Only)

#### Function (State-Changing)

matchOrder(buyOrder, buyOrderSig, sellOrder, sellOrderSig)
