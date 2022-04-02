require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("hardhat-tracer");
require("@nomiclabs/hardhat-etherscan");

const { ethers } = require("ethers");
const { INFURA_API_KEY, MNEMONIC, COINMARKETCAP_KEY, ETHERSCAN_API } = require('./.config.js');



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
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000
          }
        }
      },
      // {
      //   version: "0.8.2",
      //   settings: {
      //     optimizer: {
      //       enabled: true,
      //       runs: 200
      //     }
      //   }
      // }
    ]
  },
  networks: {
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
      gas: 3000000,
      gasPrice: 10000000000, // 10gwei
      accounts: {
        mnemonic: MNEMONIC
      }
      // accounts: ['46a5cc42a64bf582482d92eb1b910919e34ba605d3dd8da6e746843a6180000b']
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: COINMARKETCAP_KEY,
    gasPrice: 100
  },

};
