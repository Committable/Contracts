# Committable - contracts 接口文档

## 合约地址

| **合约**                            | **地址**                                       |
| :---------------------------------- | ---------------------------------------------- |
| **Ropsten测试网**                   |                                                |
| ProxyController（控制台合约）       | 0x50CD7c242aCc7F803b4322d6Cf9C5b3Ba732582f     |
| TokenProxy（代币数据合约）          | 0xbb222E8B36E4875e3bdFC4eE4c971A70e7E0A4A7     |
| TransferProxy（转账代理合约）       | 0xf1bc6f255b28390A0794b682B5BB113F2e11CF22     |
| Exchange（订单交易合约）            | ~~0x7c63d26347dFeaBD11FD93776C6A7D783f57d11f~~ |
|                                     | 0x8f57629e772939B6e83000E95f7230470a0dE314     |
| USDT（自建测试用ERC20代币）         | 0xEF0656F30a61c37b6fa41E16F7413254A1175037     |
| OxERC721Upgradeable（代币逻辑合约） | 0x4208656F513F50cE6234088b436B0380b587DD54     |

## **合约：TokenProxy**

### 只读接口

#### balanceOf(owner) 

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

查询指定地址的代币余额

**输入**

1. `owner` - `地址`：查询地址

**输出**

`balance` -`整型`：地址拥有的余额

#### ownerOf(tokenId) 

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

查询指定代币的所有者

**输入**

1. `tokenId` - `整型`：代币编号

**输出**

`owner` - `地址`：代币拥有者地址

#### name() 

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

查询合约代币名称。

**输出**

`name` - `字符串`：合约代币名称

#### symbol() 

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

查询代币合约符号

**输出**

`symbol` - `字符串`：合约代币符号

#### tokenURI(tokenId)   

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

查询指定代币的URI, 当前返回的代币URI是："https://app.committable.io/nft/\<tokenId>"

**输入**

1. `tokenId` - `整型`：指定代币编号

**输出**

`URI` - `字符串`：指定代币链接

#### totalSupply()  

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

查询代币总量

**输出**

`totalSupply` - `整型`：代币总量

#### tokenByIndex(index) 

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

根据索引查询代币编号

> 索引值从0计数，小于代币总量

**输入**

1. `index` - `整型`：代币索引

**输出**

`tokenId` - `整型`：代币编号

#### tokenByIndexBatch(indexes) 

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

根据索引数组批量查询代币编号

> 索引值从0计数，输入索引数组如[0, 1, 2]返回索引对应的tokenId数组

**输入**

1. `indexes` - `整型数组`：代币索引数组

**输出**

`tokenIds` - `整型数组`：代币编号数组

#### tokenOfOwnerByIndex(owner, index)    

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

根据索引和代币所有者地址查询代币编号

> 索引值从0计数，小于用户余额

**输入**

1. `owner` - `地址`：所有者
2. `index` - `整型`：代币索引

**输出**

`tokenId` - `整型`：代币编号

#### tokenOfOwnerByIndexBatch(owner, indexes)    

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

根据索引数组和代币所有者地址批量查询代币编号

> 索引值从0计数，输入索引数组如[0, 1, 2]返回索引对应的tokenId数组

**输入**

1. `owner` - `地址`：所有者
2. `indexes` - `整型数组`：代币索引数组

**输出**

`tokenIds` - `整型数组`：代币编号数组

#### creatorOf(tokenId) 

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

查询对应代币的创作者

输入

1. `tokenId` - `整型`：代币编号

输出

`creator` - `地址`：创作者地址

#### creatorOfBatch(tokenIds)    

![](https://img.shields.io/badge/call-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

根据代币编号数组批量查询代币创作者地址

**输入**

1. `tokenIds` - `整型数组`：代币编号数组

**输出**

`addresses` - `地址数组`：创作者地址数组

#### admin() 

![](https://img.shields.io/badge/call-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

查询管理员地址

**输出**

`admin` - `地址`：管理员地址

#### implementation() 

![](https://img.shields.io/badge/call-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

查询逻辑合约地址

> 该合约所有非管理员功能均通过delegateCall的方式调用外部逻辑合约实现

**输出**

`implementation` - `地址`：逻辑合约

### 状态改变接口

#### safeMint(to, tokenId [, _data])

![lable](https://img.shields.io/badge/send-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

向指定地址铸ERC721代币，将收款地址设置为该代币的创作者，如果收款地址是合约地则尝试调用该合约进行接口检查

> 代币编号重复和收币地址是以太坊零地址时会抛错；若收币地址是合约地址，则尝试调用该合约的onERC721Received(operator, from, tokenId, data)接口，若调用失败或者返回值不等于该接口函数选择器则抛错

**输入**

1. `to` - `地址`：收款地址
2. `tokenId` - `整型`：代币编号
3. `_data` - `动态长度字节码`：(optional) 收款地址是合约地址时的传入数据，默认值为""

**释放事件**

1. Transfer

#### transferFrom(from, to, tokenId)  

![lable](https://img.shields.io/badge/send-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

对指定编号的ERC721代币发起转账

> 收币地址是以太坊零地址会抛错

**输入**

1. `from` - `地址`：代币来源地址
2. `to` - `地址`：代币收款地址
3. `tokenId` - `整型`：代币编号

**释放事件**

1. Transfer

#### safeTransferFrom(from, to, tokenId [, calldata])  

![lable](https://img.shields.io/badge/send-%E4%BB%85%E9%9D%9E%E7%AE%A1%E7%90%86%E5%91%98-yellowgreen) 

对指定编号的ERC721代币发起转账，如果收款地址是合约地址则尝试调用该合约进行接口检查

> 收币地址是以太坊零地址会抛错；若收币地址是合约地址，则尝试调用该合约的onERC721Received(operator, from, tokenId, data)接口，若调用失败或者返回值不等于该接口函数选择器则抛错

**输入**

1. `from` - `地址`：代币来源地址
2. `to` - `地址`： 收款地址
3. `tokenId` - `整型`：代币编号
4. `calldata` - `动态长度字节码`：(optional) 收款地址是合约地址时的传入数据，默认值为""

**释放事件**

1. Transfer



#### changeAdmin(newAdmin)  

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

转移管理员权限

**输入**

1. `newAdmin` - `地址`：新管理员

**释放事件**

1. AdminChanged

#### upgradeTo(newImplementation)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

更新逻辑合约

**输入**

1. `newImplementation` - `地址`：新逻辑合约

**释放事件**

1. Upgraded

#### upgradeToAndCall(newImplementation, bytes data)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

更新逻辑合约，并调用该合约

**输入**

1. `newImplementation` - `地址`：新逻辑合约
2. `data` - `动态长度字节码`：调用数据

**释放事件**

1. Upgraded

### 事件

#### Approval(indexed owner, indexed approved, indexed tokenId)

触发事件：指定地址获得指定代币的授权

**输入**

1. `owner` - `地址`：该代币拥有者地址
2. `approved` - `地址`：获得授权者地址
3. `tokenID` - `整形`：代币编号

#### ApprovalForAll(indexed owner, indexed operator, approved)

触发事件：指定地址获得所有者地址所有代币的授权

**输入**

1. `owner` - `地址`：代币所有者地址
2. `approved` - `地址`：获得授权者地址
3. `approved` - `布尔值`：获得全部授权为true

#### Transfer(indexed from, indexed to, indexed tokenId)

触发事件：转账

**输入**

1. `from` - `地址`：转账来源地址
2. `to` - `地址`：转账收款地址
3. `tokenId` - `整型`：代币编号

#### AdminChanged(previousAdmin, newAdmin)

触发事件：管理员地址更换

**输入**

1. `previousAdmin` - `地址`：原管理员地址
2. `newAdmin` - `地址`：新管理员地址

#### Upgraded(indexed implementation)

触发事件：代币逻辑升级

**输入**

1. `implementation` - `地址`：升级后的逻辑合约地址

## 合约：TransferProxy

### 只读接口

#### isDisabled (address _address) 

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询该合约对指定地址的转账权限

**输入**

1. `_address` - `地址`：查询地址

**输出**

`bool` - `布尔值`：该值为true时表示该合约没有对指定地址的转账权限，false表示拥有转账权限

#### proxyController()

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询ProxyController合约地址

**输出**

`proxyController` - `地址`：proxyController合约地址

### 状态改变接口

#### safeTransferFrom( _token, _from, _to, tokenId)

![](https://img.shields.io/badge/send-%E4%BB%85%E9%83%A8%E5%88%86%E5%9C%B0%E5%9D%80-yellowgreen) 

调用指定智能合约地址，并对指定代币编号的ERC721代币发起转账

> 允许访问该接口的地址由ProxyController合约登记和管理

**输入**

1. `_token` - `地址`：ERC721代币合约地址
2. `_from` - `地址`：代币来源地址
3. `_to` - `地址`：代币收款地址
4. `tokenID` - `整形`：代币编号

**释放事件**

1. Transfer：TokenProxy合约

#### disable(_bool)  

![](https://img.shields.io/badge/send-%E5%85%AC%E5%BC%80-green) 

设置该合约对发送者地址的ERC721转账权限

> TransferProxy合约默认对TokenProxy合约的所有ERC721代币拥有转账权，

**输入**

1. `_bool` - `布尔值`：设置该值为true来关闭转账权限，false开启转账权限

**释放事件**

1. ProxyDisabled



### 事件

#### ProxyDisabled(indexed _address, _bool)

事件：用户取消、开启代理转账功能

**输入**

1. `_address` - `地址`：用户地址
2. `_bool` - `布尔值`：取消代理转账功能该值为true，开启代理转账功能该值为false（默认对所有地址开启该功能）

## 合约：ProxyController

### 只读接口

#### transferProxy()

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询TransferProxy合约地址

**输出**

1. `transferProxy` - `地址`：tranferProxy合约地址

#### contracts(_address)

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询指定地址是否有权访问TransferProxy合约的safeTransferFrom()函数

**输入**

1. `_address` - `地址`：查询的地址

**输出**

1. `_bool` - `地址`：该值为true时表示查询地址有权访问TokenProxy合约的safeTransferFrom()函数

#### getProxyImplementation(proxy)

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询TokenProxy合约的逻辑合约地址(OxERC721Upgradeable合约)

**输入**

1. `proxy` - `地址`：TokenProxy合约地址

**输出**

`implementation` - `地址`：TokenProxy合约的逻辑合约地址

#### getProxyAdmin(proxy)

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询TokenProxy合约的管理员地址

**输入**

1. `proxy` - `地址`：TokenProxy合约地址

**输出**

`admin` - `地址`：TokenProxy合约的管理员地址

#### owner()

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询该合约的管理员地址

**输出**

`owner` - `地址`：该合约的管理员地址状态改变接口

### 状态改变接口

#### grantAuthentication(_address)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

授权指定地址对TransferProxy合约的safeTransferFrom()函数的访问权

**输入**

1. `_address` - `地址`：授权的地址

#### RevokeAuthentication(_address)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

取消指定地址对TransferProxy合约的safeTransferFrom()函数的访问权

**输入**

1. `_address` - `地址`：取消的地址

#### setProxy(_address)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

初始化设置TransferProxy的合约地址

**输入**

1. `_address` - `地址`：TransferProxy合约地址



#### changeProxyAdmin(proxy, newAdmin)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

转移TokenProxy合约的管理员权限

**输入**

1. `proxy` - `地址`：TokenProxy合约地址
2. `newAdmin` - `地址`：新管理员地址

**释放事件**

1. AdminChanged：TokenProxy合约

#### upgrade(proxy, implementation)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

升级更新TokenProxy合约的逻辑合约

**输入**

1. `proxy` - `地址`：TokenProxy合约地址
2. `implementation` - `地址`：新逻辑合约地址

**释放事件**

1. Upgraded：TokenProxy合约

#### upgradeAndCall(proxy, implementation, data)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

升级更新TokenProxy合约的逻辑合约，并代理调用(delegateCall)逻辑合约

**输入**

1. `proxy` - `地址`：TokenProxy合约地址
2. `implementation` - `地址`：新逻辑合约地址
3. `data` - `动态长度字节码`：调用数据

**释放事件**

1. Upgraded：TokenProxy合约

#### renounceOwnership()

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

放弃对该合约的管理权限

**释放事件**

1. OwnershipTransferred

#### transferOwnership(newOwner)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

转移该合约的管理权限

**输入**

1. `newOwner` - `地址`：新管理员的地址

**释放事件**

1. OwnershipTransferred

### 事件

#### OwnershipTransferred(indexed previousOwner, indexed newOwner)

事件：转移管理权限

**输入**

1. `previousOwneer` - `地址`：原管理员地址
2. `newOwner`- `地址`：新管理员地址

## 合约：Exchange

### 只读接口

####  checkOrderStatus(orderHash) 

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

检查指定订单状态

**输入**

1. `orderHash` - `32字节`：查询的订单海鲜汁

**输出**

`bool` - `布尔值`：订单状态（true代币订单可以执行，false代币订单已经执行完毕或者已经被取消）

#### getPlatformFee

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

读取交易合约平台费率

**输出**

`platFormFee` - `整型`：平台费率（有效值在0 ~ 10000之间，对应百分比费率为platFromFee / 100）

#### getPatentFee(contractAddress, tokenId)

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询指定代币的专利费率

**输入**

1. `contractAddress` - `地址`：代币的合约地址
2. `tokenId` - `整型`：代币编号

**输出**

`patentFee` - `整型`：代币专利费率（有效值在0 ~ 10000之间，对应百分比费率为patentFee / 100）

#### getRecipient()

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询平台费收款地址

**输出**

`recipient` - `地址`：平台费收款地址

#### owner()

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询平台管理员地址

**输出**

`owner` - `地址`：平台管理员地址

#### <span id="test">getAssetHash(asset)</span>

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询支付资产对象的哈希值

> 该函数用于开发测试，在实际环境中不起作用

**输入**

1. `asset` - `对象`：[支付资产](#asset)

**输出**

`hash` - `32字节`：资产哈希值

#### getNftHash(nft)

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询出售资产对象的哈希值

> 该函数用于开发测试，在实际环境中不起作用

**输入**

1. `nft` - `对象`：[出售资产](#nft)

**输出**

`hash` - `32字节`：资产哈希值

#### getOrderHash(order)

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

查询出售资产对象的哈希值

> 该函数用于开发测试，在实际环境中不起作用

**输入**

1. `order` - `对象`：[订单](#order)

**输出**

`hash` - `32字节`：订单哈希值

#### getRecover(order, signature)

![](https://img.shields.io/badge/call-%E5%85%AC%E5%BC%80-green) 

根据订单和签名计算签名地址

> 该函数用于开发测试，在实际环境中不起作用

**输入**

1. `order` - `对象`：[订单](#order)
2. `signature` - `动态长度字节`：签名

**输出**

`signer` - `地址`：根据订单和签名计算出的签名地址

### 状态改变接口

#### cancelOrder(order)

![](https://img.shields.io/badge/send-%E5%85%AC%E5%BC%80-green) 

取消指定订单

**输入**

1. <span id="order">`order`</span> - `对象`：准备取消的订单 

   - `exchange` - `地址`：订单执行的交易合约地址

   - `isBuyer` - `布尔值`：该订单创建人所处的买卖方（true代表买家订单，false代表卖家订单）

   - `isAuction` - `地址`：该订单交易方式（true代表拍卖，false代表直售）

   - `maker` - `地址`：该订单创建者

   - <span id="asset">`buyAsset`</span> - `对象`：支付资产（目前支持使用ETH和ERC20代币进行支付）

     - `assetClass` - `4字节`：资产类型

       目前定义了两种购买使用的资产类型，分别是

       ```javascript
       const ETH_CLASS = web3.utils.keccak256("ETH").slice(0, 10); // 0xaaaebeba
       const ERC20_CLASS = web3.utils.keccak256("ERC20").slice(0, 10); // 0x8ae85d84
       ```

     - `contractAddress` - `地址`：购买支付的资产合约地址，当资产是ETH时，在此处键入以太坊零地址即可

     - `value` - `整型`：数量，单位是wei

   - <span id="nft">`nftAsset`</span> - `对象`：出售资产（目前支持出售ERC721代币）

     - `contractAddress` - `地址`：出售资产的合约地址（即TokenProxy合约地址）
     - `tokenId` - `整型`：出售资产的编号
     - `patentFee` - `整型`：设置的专利费率（有效值在0 ~ 10000之间，对应的百分比费率 = 专利费率/100）当卖单的创建者是出售资产的创作者时，在订单交易完成后会更新该出售资产的专利费率。

   - `salt` - `整型`：随机值

   - `start` - `整型`：提交订单时的时间戳，单位是秒，执行交易时如果当前时间戳小于该值则终止交易

   - `end` - `整型`：订单的最后有效时间戳，单位是秒，执行订单交易时如果当前时间戳超过该值则终止交易

**释放事件**

1. OrderCancelled

#### matchAndExecuteOrder(buyOrder, buyOrderSig, sellOrder, sellOrderSig )

![](https://img.shields.io/badge/send-%E4%BB%85%E9%83%A8%E5%88%86%E5%9C%B0%E5%9D%80-yellowgreen) 

检查指定订单状态

> 根据订单交易方式的不同该函数的访问权限也不同，对于订单交易方式是直售的订单，仅订单对应的买方地址可以调用该函数，对于拍卖订单，仅订单对应的卖方地址可以调用该函数

**输入**

1. `buyOrder` - `对象`：买方订单
2. `buyOrderSig` - `动态长度字节码`：买方订单的签名（签名规则见附录）
3. `sellOrder` - `对象`：卖方订单
4. `sellOrderSig` - `动态长度字节码`：买方订单的签名

**释放事件**

1. OrderMatched
2. Transfer：ERC20代币合约
3. Transfer：TokenProxy合约
4. PatentFeeChanged（当卖家是创作者时会释放该事件）

#### changePlatformFee(_fee)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

更新平台费率

**输入**

1. `_fee` - `整型`：新的平台费率（有效值在0 ~ 10000之间，对应百分比费率为_fee / 100）

**释放事件**

1. PlatformFeeChanged

#### changeRecipient(_recipient)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

更新平台费收款地址

**输入**

1. `_recipient` - `地址`：新的平台费收款地址

**释放事件**

1. RecipientChanged

#### renounceOwnership()

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

放弃管理员权限

**释放事件**

1. OwnershipTransferred

#### transferOwnership(newOwner)

![](https://img.shields.io/badge/send-%E4%BB%85%E7%AE%A1%E7%90%86%E5%91%98-red) 

转移管理员权限

**输入**

1. `_newOwner` - `地址`：新的管理员地址

**释放事件**

1. OwnershipTransferred

### 事件

#### OrderCancelled(orderHash, indexed maker)

事件：订单取消

**输入**

1. `orderHash` - `32字节`：订单哈希值
2. `maker` - `动态长度字节`：订单创建者（取消者）地址

#### OrderMatched(buyOrderHash, sellOrderHash, indexed buyer, indexed seller, indexed tokenId, isAuction, assetClass, contractAddress, price)

事件：订单完成

**输入**

1. `buyOrderHash` - `32字节`：买单哈希值
2. `sellOrderHash` - `32字节`：卖单哈希值
3. `buyer` - `地址`：买单创建者地址
4. `seller` - `地址`：卖单创建者地址

5. `tokenId` - `整型`：成交NFT代币编号
6. `isAuction` - `布尔值`：订单类型，该值为true时是拍卖单，该值为false值是普通订单

7. `assetClass` - `4字节`：支付货币类型（目前仅支持ETH和ERC20，具体取值规则是“ETH”和“ERC20”的哈希值的前4个字节）
8. `contractAddress` - `地址`：支付货币的合约地址
9. `price` - `整型`：支付价格

#### OwnershipTransferred(indexed previousOwner, indexed newOwner)

事件：管理权限转移

**输入**

1. `previousOwner` - `地址`：原管理员
2. `newOwner` - `地址`：新管理员

#### PatentFeechanged(indexed contractAddress, indexed tokenId, originalFee, newFee)

事件：版权费改变

**输入**

1. `contractAddress` - `地址`：nft代币合约地址
2. `tokenId` - `地址`：nft代币编号
3. `originalFee` - `整型`：原版权费
4. `newFee` - `整型`：新版权费

#### PlatformFeeChanged(originalFee, newFee)

事件：平台费改变

**输入**

1. `originalFee` - `整型`：原平台费
2. `newFee` - `整型`：新平台费

#### RecipientChanged(originalRecipient, newRecipient)

事件：平台费收款地址改变

**输入**

1. `originialRecipient` - `地址`：原平台费收款地址
2. `newRecipient` - `地址`：新平台费收款地址

## 附录

### 订单创建示例（web3.js）

**合约内部支付资产、出售资产和订单结构体如下**

```solidity
library LibAsset {
    struct Asset {
        bytes4 assetClass;
        address contractAddress;
        uint256 value;
    }
    struct NFT {
        address contractAddress;
        uint256 tokenId;
        uint256 patentFee;
    }
}
library LibOrder {
	    struct Order {
        address exchange;
        bool isBuyer; // true for buy order, false for sell order
        bool isAuction; //true for auction, false for instant pay
        address payable maker;
        LibAsset.Asset buyAsset;
        LibAsset.NFT nftAsset;
        uint256 salt;
        uint256 start;
        uint256 end;
    }
}
```

**链下按以下方式封装BuyAsset, NftAsset和Order**

```javascript
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


```

**链下创建订单实例：买单/直售**

```javascript
const ETH_CLASS = web3.utils.keccak256("ETH").slice(0, 10); // ETH_ASSET_CLASS = bytes4(keccak256("ETH"));
const ADDRESS_0 = '0x0000000000000000000000000000000000000000' // Contract address (address(0)) input for ETH
const ADDRESS_NFT = '' // 输入TokenProxy合约地址
let price = '10000' // 支付数量，注意该处单位为wei
let token_id = 123 // 购买代币编号为123的ERC721代币
let patentFee = 0 // 买方订单该值无效，但输入值需要在0~10000间

let buy_order = new Order(
  exchange_address, // 输入Exchange合约地址
  true,	// 买方订单该值为true
  false, // 直售订单该值为false
  accounts[1], // 订单创建者，此处需要更改为metamask账号地址
  new BuyAsset(ETH_CLASS, ADDRESS_0, price), // 支付资产
  new NftAsset(ADDRESS_NFT, token_id, patentFee), // 出售资产
  Math.floor(Math.random() * 100000000), // 随机salt值
  Math.floor(Date.now() / 1000), // 当前时间戳，单位是秒
  Math.floor(Date.now() / 1000) + 60 *
  60 * 24 * 7 // 订单有效期截止时间戳，单位是秒
)
```



### 订单签名示例（web3.js）

将创建的订单对象按规则进行编码和哈希运算，对结果进行签名

**合约内部订单编码和哈希规则如下**

```solidity
// 智能合约   
library LibAsset {
    function hash(Asset memory asset) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(asset.assetClass, asset.contractAddress, asset.value)
            );
    }
     function hash(NFT memory nft) internal pure returns (bytes32) {
        return  
            keccak256(
                abi.encode(nft.contractAddress, nft.tokenId, nft.patentFee)
            );
    }
}
library LibOrder {
    function hash(Order memory order) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    order.exchange,
                    order.isBuyer, // true for buy order, false for sell order
                    order.isAuction, //true for auction, false ofr direct pay
                    order.maker,
                    LibAsset.hash(order.buyAsset),
                    LibAsset.hash(order.nftAsset),
                    order.salt,
                    order.start,
                    order.end
                )
            );
    }
}

```

**链下按以下方式对订单哈希函数进行封装**

```javascript
const hashAsset = (asset) => {
  let asset_encode =
    web3.utils.padRight(asset.assetClass, 64) +
    web3.eth.abi.encodeParameters(['address', 'uint256'], [asset.contractAddress, asset.value]).slice(2);
  return asset_hash = web3.utils.keccak256(asset_encode);
}

const hashNft = (nft) => {
  let nft_encode =
    web3.eth.abi.encodeParameters(['address', 'uint256', 'uint256'], [nft.contractAddress, nft.tokenId, nft.patentFee]);
  return nft_hash = web3.utils.keccak256(nft_encode);
}

const hashOrder = (order) => {
  let order_encode =
    web3.eth.abi.encodeParameters(
      ['address', 'bool', 'bool', 'address', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256'],
      [order.exchange, order.isBuyer, order.isAuction, order.maker,
      hashAsset(order.buyAsset), hashNft(order.nftAsset),
      order.salt, order.start, order.end]
    );
  return order_hash = web3.utils.keccak256(order_encode);
}
```

链下对订单对象进行哈希并签名

```javascript
let buy_order_hash = hashOrder(buy_order); // 获取订单哈希
let buy_order_sig = await web3.eth.sign(buy_order_hash, account) // 具体签名方法参考metamask api

```

Exchange合约提供了几个[测试函数](#test)，可以对链下订单哈希运算步骤和结果进行检查
