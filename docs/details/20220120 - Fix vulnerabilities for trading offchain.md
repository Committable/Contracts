## 20220120 - Fix vulnerabilities for trading offchain CMT

Controller deployed to: **0xd8d5502D907E41De5ac1fA1b129812da53eF4a7a**

Committable deployed to: **0x378E528a275Cd9735837f1b14F735f88BC8661E7**

Exchange deployed to: **0x48aEe3F428D7cc41555f2FeFB2d5436849e50400**

### Front-end

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

### Server-side

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

