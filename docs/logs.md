# Committable Contract Logs

## 20220708 - Implement ERC721 transfer method for Exchange

```solidity
contract Exchange {
	   /**
     * @dev support transfer unminted tokens with token signature
     */
    function transferERC721(
        address to, // 收款人地址
        address contractAddress, // erc721合约地址
        uint256 tokenId, // tokenId
        bytes memory tokenSig // 铸币签名：输入”0x00“表示转账链上代币，输入token签名会前铸造到创造者地址，再转账到收款人
    ) external {
        _transferERC721(msg.sender, to, contractAddress, tokenId, tokenSig);
    }

}
```



## 20220708 - Support EIP712 for ERC721 and Payroll signature

**签名编码原理如下**

```solidity
 // Solidity file
 contract ERC721Committable {
 // 计算域名分隔符哈希
 bytes32 DOMAIN_SEPARATOR = keccak256
 				(
            abi.encode // 常规编码：1. 地址与整型：将每个不足32个字节的元素添加前置”0“到32个字节 2. 将元素按顺序拼接
            ( 
                keccak256
                (
                "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(_name)), //这里名字固定使用”ERC721Committable“
                keccak256(bytes("1")),
                chainId, // rinkeby链Id为4
                address(this) // 该合约的合约地址
            )
        );
  // 计算结构体类型哈希       
  bytes32 types = keccak256("Mint(address creator,uint256 tokenId)")
  // 这个值是静态的：0xe6c296e11cbaaec3fa9033cd6f86ffb254e2601a752ff969259c9aa361b35d89


	// 构建摘要
  bytes32 digest = keccak256(
            abi.encodePacked( // Packed编码：不需要将每个元素添置32个字节，直接按顺序拼接
                "\x19\x01",
                DOMAIN_SEPARATOR, 
                keccak256(
                    abi.encode( // 常规编码
                        //keccak256("Mint(address creator,uint256 tokenId)")
                        0xe6c296e11cbaaec3fa9033cd6f86ffb254e2601a752ff969259c9aa361b35d89,
                        creator, // 创建者地址
                        tokenId // 代币编号
                    )
                )
            )
        );
 }
 
 
  // Solidity file
 contract PayrollPool {
 // 计算域名分隔符哈希
 bytes32 DOMAIN_SEPARATOR = keccak256
 				(
            abi.encode // 常规编码：1. 地址与整型：将每个不足32个字节的元素添加前置”0“到32个字节 2. 将元素按顺序拼接
            ( 
                keccak256
                (
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(_name)), //这里名字固定使用”PayrollPool“
                keccak256(bytes("1")),
                chainId, // rinkeby链Id为4
                address(this) // 该合约的合约地址
            )
        );
  // 计算结构体类型哈希       
  bytes32 types = keccak256("Claim(uint256 index,uint256 amount,address user)")
  // 这个值是静态的：0x2c400e34dccd136c63692253b13cbe502fc45768c04c0584e74b7cc15fda3487


	// 构建摘要
  bytes32 digest = keccak256
  			(
            abi.encodePacked( // Packed编码：不需要将每个元素添置32个字节，直接按顺序拼接
                "\x19\x01",
                DOMAIN_SEPARATOR, 
                keccak256(
                    abi.encode(
                        //keccak256("Claim(uint256 index,uint256 amount,address user)")
                        0x2c400e34dccd136c63692253b13cbe502fc45768c04c0584e74b7cc15fda3487,
                        index, // Pool Id
                        amount, // 领取金额
                        msg.sender // 领取地址
                    )
                )
            )
        );
 }
 
 

```

**JavaScript签名示例**

```javascript
const { ethers } = require("hardhat");
// 计算域名分隔符
let erc721Committable.domain =
        {
            name: 'ERC721Committable',
            version: '1',
            chainId: 1337, // hardhat chainId for test only
            verifyingContract: erc721Committable.address // assign this value accordingly
        }
// 计算结构体哈希
let erc721Committable.types =
        {
            Mint: [
                { name: 'creator', type: 'address' },
                { name: 'tokenId', type: 'uint256' },
            ]
        }

// 构造签名数据
let mint_0 = 		{
            creator: signer.address, 
            tokenId: tokenId_0,
            }

// 利用ethers.js提供的结构签名函数进行签名
let signature_0 = await signer._signTypedData(erc721Committable.domain, erc721Committable.types, mint_0);

// 计算域名分隔符
let payroll.domain =
        {
            name: 'PayrollPool',
            version: '1',
            chainId: 1337, // hardhat chainid for test only
            verifyingContract: payrollProxy.address // assign this value accordingly
        }
// 计算结构体哈希
let payroll.types =
        {
            Claim: [
                { name: 'index', type: 'uint256' },
                { name: 'amount', type: 'uint256' },
                { name: 'user', type: 'address' },
            ]
        }
// 构造签名数据
let claim = {
        index: index,
        amount: claimAmount,
        user: user.address
      	}
// 利用ethers.js提供的结构签名函数进行签名
let sig = await signer._signTypedData(payroll.domain, payroll.types, claim)		
```



## 20220512 - Support EIP712 & Shared Proxy

Controller: 0xA5a6f260F5CF1f30a41e849B5a96Ba5916dB9064
CommittableV1: 0xf9e4be33B7c95A55E4e0e82B399445Df95de84a1
Committable: 0x8e6AC69f8c4f777f9Adbb9B9924263Fdd853fB7F
TransferProxy: 0x96Cfe03A23936F023f40914E2478d0feDdDdbB3D
Exchange: 0x32c31CD0b3E4d2E24b70820B7B0dD08ca2933fD1
PayrollPool: 0xA2f3A66A67491f0FB0e5756dec4B39ff218A7f44
USDTMock: 0xD2856Dfc2948711B1659FaaBcb200e0717470E2A

1. **为测试opensea，从该版本开始合约部署到rinkeby测试网（注意前端、后端、subgraph等配置）**
2. **现在不再需要查询或为每个用户地址创建Router了**

3. **对订单结构体和编码方式有一定调整**

```javascript
let buy_order = {
        isBuySide: true, //买卖单布尔值，是买单时设置为true
        isAuction: false, //订单类型布尔值，定价设置为false，拍卖设置为true
        maker: buyer.address, //订单创建者地址，该必须用该地址私钥对该订单进行签名
        paymentToken: ZERO_ADDRESS, //支付用的ERC20合约地址
        value: PRICE, //买方愿意支付或卖方愿意接受的支付数量
        royaltyRecipient: royaltyRecipient.address, //版权费收款地址
        royalty: 0, //版权费万分比比例，设置为100代表1%
        target: committable.address, // 对外调用地址，即交易对象的合约地址，这里是committable地址
        tokenId: tokenId_0, // 要交易的tokenId
        tokenSig: UINT256_ZERO, // 铸币签名，买单该值固定输入0x00，卖单输入0x00时表示交易已铸币的token，卖单输入token签名时				表示交易未铸币的地址
        start: 0, // 该订单可以执行的最早时间戳（秒），设置成0表示不限制订单开始时间
        end: 0, // 该订单可以执行的最晚时间戳（秒），设置成0表示不限制订单结束时间
        salt: Math.floor(Math.random() * 10000) // 随机值，目的是让两组参数相同的订单有不一样的哈希值
      }
// 对编码有一定调整以支持EIP712，该order哈希值作为订单结构体的唯一标识 
// 在对order对象进行编码时，在所有参数前插入一个TYPEHASH以供钱包验证
// bytes32 ORDER_TYPEHASH = keccak256("Order(bool isBuySide,bool isAuction,address maker,address paymentToken,uint256 value,address royaltyRecipient,uint256 royalty,address target,uint256 tokenId,bytes tokenSig,uint256 start,uint256 end,uint256 salt)")
// bytes32 ORDER_TYPEHASH = 0x27032b6564c9c203f2bd0f0ccd36b2529e0811ecf18a68db0e2c9c09315bd252;
// 注意，对tokenSig要先计算一次keccak256转换成32字节
// 具体编码方式如下
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
```

4. **支持EIP712**

```javascript
// 按如下方式创建javascript对象
const DOMAIN = {
  name: 'Exchange',
  version: '1',
  chainId: 4, // rinkeby chainid
  verifyingContract: '0x32c31CD0b3E4d2E24b70820B7B0dD08ca2933fD1' // 这里设置成交易合约的合约地址
}; 
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

// 以下是ether.js的EIP712签名方式
let buy_order_sig_0 = await buyer._signTypedData(DOMAIN, TYPES, buy_order_0);

```

5. **USDTMock（ERC20）现在支持自助领取了**

转账0个ETH至该token的合约地址可以获得1000个测试代币，可以重复领取

6. **交易合约不再提供订单状态批量查询接口**
7. **签名验证地址更换为0x5dA5b801E128667c496D8C2527d21895d2cf24CB**
8. **当前交易合约费率设置为0**

## 20220402 - Update Committable Contract (gas optimization)

Committable deployed to: 0x2AF8B6f5538bDf831c9066Ca27bFF2bc8e3Ff258

CommittableV1 deployed to: 0xAD8BA8983cFda26deD359d81258877D454961f33

```javascript
//移除了Committable合约的tokenOfOwnerByIndex和tokenByIndex方法
//相关索引方式通过thegraph（eventHandlers）获取
```

## 20220307 - Re-deploy Contracts

Committable deployed to: 0x569Acd67399A90c2b04B49b93E6ed07bE4751255

CommittableV1 deployed to: 0x1Be89BfB9aca45A2008608BB4bEa341BEA57dE11

## 20220307 - Re-deploy Contracts

Committable deployed to: 0x6E5f43470e301b8508176F58a77e8C83e59FF1E2

CommittableV1 deployed to: 0x64fe9358538318C537c11233a04c67B388Da1933

## 20220307 - Fix Exchange Vulnerability

exchange deployed to: 0xB976678B0dA3F1632A2E442325c9eB8CB9E00BdC

```javascript
// 移除订单结构体taker字段（移除与之相关的逻辑）
// 添加isAuction字段 （false代表定价出售，true代表拍卖）
// 接口参数调整，注意更新abi
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
