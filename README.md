# Committable | contracts

 ![](https://img.shields.io/badge/npm-6.12.1-blue)  ![](https://img.shields.io/badge/node-12.13.1-green)

**Smart contracts that allow users to manage and exchange non-fungible tokens securely and smoothly.**

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

Create following file in the root folder before deployment or running any tests:

**.config.js**

```javascript
const NAME = "<your_token_name>";
const SYMBOL = "<your_token_symbol>";
const INFURA_API_KEY = '<your_infura_api_key>'; 
const COINMARKETCAP_KEY = '<your coinmarketcap api>' // use for gas reporter
const ROPSTEN_MNEMONIC = '<your mnemonic>'; // use wallet for test-net only

module.exports = {NAME, SYMBOL, INFURA_API_KEY, ROPSTEN_MNEMONIC, COINMARKETCAP_KEY};

```

You can customize network configurations in **hardhat.config.js**, by default we use infura as our provider to communicate with Ethereum blockchain.

### Test

Testing scripts with ethers.js and Waffle are located at **./test/** folder, run following commands to start testing

```bash
$ npm run test
```

### Deployment

Deployment scripts with ethers.js are located at **./scripts/** folder, run following commands to deploy

```bash
$ npm run ropsten ./scripts/deploy.js
```

Above script will deploy five contracts on ropsten network and make additional transactions  to chain them 

## Documents

[API documents (Chinese version)](./docs/api) are available now.

