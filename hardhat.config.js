require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("hardhat-tracer");

const { ethers } = require("ethers");
const {INFURA_API_KEY, MNEMONIC, COINMARKETCAP_KEY} = require('./.config.js');



// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
      gas: 3000000,
      gasPrice: 5000000000,
      accounts: {
        mnemonic: MNEMONIC
      }
    },
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: COINMARKETCAP_KEY,
    gasPrice: 100
  },
  
};
