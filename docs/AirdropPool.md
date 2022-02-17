# AirdropPool 

**AirdropPool: ~~0xD8bd5D05f4F5f956D9097C1C1eAc3E8D3Da3b6d1~~** (Updated at 26th Jan)

**AirdropPool: ~~0x04fbA4D3d98ACEBB5Ba394557425e78884dDC721~~**(Updated at 26th Jan: allow input for index)

**AirdropPool: ~~0x206b78B162545a9C5216b8ef0B59D3B8792A61C8~~** (Updated at 26th Jan)

0x55c72CE0B3BA067fAfFF43126e5f56992148e8Df (17 Feb)

### Functions (Read-Only)

##### **getPoolInfo(index)**

查询指定空投池的信息

**输入**

1. `index` - `整型`：空投池编号（编号从0开始）

**输出**

`poolInfo` -`struct`：空投池结构体

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

##### **getUserInfo(index, user)**

查询指定地址在指定空投池的空投领取情况

**输入**

1. `index` - `整型`：空投池编号（编号从0开始）
2. `user` - `地址`：用户地址

**输出**

`isClaimed` -`bool`：用户是否已经领取该空投池空投

### Functions (State-Changing)

##### **create(index, rewardToken, rewardAmount, start, end)**

创建空投池

> 需要先授权AirdropPool合约使用创建者的代币

**输入**

1. `index` - `整型`：空投池编号（不能重复）
1. `rewardToken` - `地址`：空投代币合约地址
2. `rewardAmount` - `整型`：空投代币金额 （注意输入时乘以decimal值）
3. `start` - `整型`：空投开始时间戳（秒）
4. `end` - `整型`：空投结束时间戳（秒）

**释放事件**：PoolCreated

##### **claim(index, amount, sig)**

领取空投

> 必须在空投开始 - 结束期内才可以调用该方法，必须提供有效签名

**输入**

1. `index` - `整型`：空投池编号
2. `amount` - `整型`：领取数额
3. `sig` - `动态长度字节码`：签名

```javascript
// 在快照时间需要服务器计算特定地址应领取金额，并对数额进行签名
// 编码规则：空投池编号 + 领取数量 + 用户地址 （每个按abi编码补充为32字节后衔接在一起，对其哈希结果进行签名）
hash = ethers.utils.keccak256(abiCoder.encode(['uint256', 'uint256', 'address'], [index, claimAmount, user.address]));
// 用服务器端私钥进行签名
sig = await signer.signMessage(ethers.utils.arrayify(hash));
```

**释放事件**：RewardClaimed

##### **withdraw(index)**

空投池创建者领取剩余未分配代币

> 调用者必须是空投池创建者，必须在空投结束时间才可以调用该方法

**输入**

1. `index` - `整型`：空投池编号

**释放事件**：RewardClaimed

### Events 

##### **PoolCreated**

**参数**

1. `空投池编号` - `整型`：空投池编号
2. `奖励代币` - `地址`：空投代币合约地址
3. `空投代币总额` - `整型`：空投总金额
4. `创建者` - `地址`：空投池创建地址
5. `空投开始时间` - `整型`：空投开始时间
6. `空投结束时间 - `整型`：空投结束时间

##### RewardClaimed

**参数**

1. `空投池编号` - `整型`：空投池编号
2. `奖励代币` - `地址`：空投代币合约地址
3. `领取代币金额` - `整型`：领取空投金额
4. `用户地址` - `地址`：领取空投的用户地址