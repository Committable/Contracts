# Committable Contracts 更新日志

## 铸币签名漏洞修复

2022.01.05

### 前端

```javascript
// 更新interface
const interface = new ethers.utils.Interface([
  "function mint(address creator, uint256 tokenId, bytes signature)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function mintAndTransfer(address creator, address to, uint256 tokenId, bytes signature)"
])

// 延迟铸币模式下：用新的encodeMintAndTransfer代替encodeMintWithSig
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

//以下是延迟订单示例
      buy_order_4 = new Order(
        exchange.address,
        true,
        buyer.address,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        PRICE,
        ZERO_ADDRESS,
        0,
        committable.address,
        encodeMintAndTransfer(ZERO_ADDRESS, buyer.address, tokenId_4),
        encodeMintAndTransferReplacement(true),
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
        committable.address,
        encodeMintAndTransfer(seller.address, ZERO_ADDRESS, tokenId_4, signature_4),
        // signature由后端提供铸币签名
        encodeMintAndTransferReplacement(false),
        0,
        0,
        Math.floor(Math.random() * 10000)
      )
```

### 后端

服务器对铸币签名对象调整变更为： 铸币地址（创作者）+ tokenId，abi编码的哈希结果

```javascript
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

