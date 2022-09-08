# Committable | contracts

 ![](https://img.shields.io/badge/npm-8.0.0-blue)  ![](https://img.shields.io/badge/node-16.11.4-green)

**Committable smart contracts enable developers to tokenize their contributions (the ’commit‘) to open source projects and provide flexible and secure protocols for trading and supporting them.**

- Implementation of ERC721Upgradeable with [Transparent proxy pattern](https://blog.openzeppelin.com/the-transparent-proxy-pattern/).
- Flexible and secure proxy scheme that allows smooth transfer and role-based permissions.
- Robust exchange protocol that can verify and execute off-chain generated order pairs.

## Overview

### Installation

Install npm packages.

```bash
$ npm install
```

### Compile

Run following command to compile all solidity files located at ./contracts folder

```bash
$ npm run compile
```

### Usage

Create following file in the root folder before deployment:

**.env**

```javascript
ALCHEMY_RINKEBY_URL = '<your alchemy api url>'
MNEMONIC = '<your mnemonic>'
```

You can customize network configurations in **hardhat.config.js**, by default we use alchemy as the provider to communicate with Ethereum blockchain.

### Test

Testing scripts are located at **./test/** folder, run following commands to start 

```bash
$ npm run test
```

### Deployment

Run following commands to deploy on rinkeby network, additional interactions will complete initial settings

```bash
$ npm run rinkeby ./scripts/deploy.js
```



