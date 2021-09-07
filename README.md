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

### Usage

Create following file in the root folder before deployment or running any tests:

**.setting.js**

```javascript
const NAME = "<your_token_name>";
const SYMBOL = "<your_symbol_name>";
const ALCHEMY_API_KEY = '<your_alchemy_api_key>'; 
const COINMARKETCAP_KEY = '<your coinmarketcap api>' // use for gas reporter
const ROPSTEN_MNEMONIC = '<your mnemonic>'; // use wallet for test-net only

module.exports = {NAME, SYMBOL, ALCHEMY_API_KEY, ROPSTEN_MNEMONIC, COINMARKETCAP_KEY};

```

You can customize network configurations in **hardhat.config.js**, by default we use hdwallet and alchemy to communicate with Ethereum blockchain.

### Test

Testing scripts with ethers.js and Waffle are located at **./test/** folder, run following commands to start

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

