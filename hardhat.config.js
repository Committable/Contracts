require("@nomiclabs/hardhat-waffle");

require("hardhat-gas-reporter");

require("hardhat-tracer");
require("@nomiclabs/hardhat-etherscan");
const { ethers } = require("ethers");
require('dotenv').config()
require("solidity-coverage");




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
    // ropsten: {
    //   url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
    //   gas: 3000000,
    //   gasPrice: 10000000000, // 10gwei
    //   accounts: {
    //     mnemonic: MNEMONIC
    //   }
    // },
    rinkeby: {
      url: process.env.ALCHEMY_RINKEBY_URL,
      gas: 3000000,
      gasPrice: 20000000000, // 20gwei
      accounts: [process.env.PRIVATE_KEY]
      
    },
    goerli: {
      url: process.env.ALCHEMY_GOERLI_URL,
      gas: 3000000,
      // gasPrice: 20000000000, // 20gwei
      accounts: [process.env.PRIVATE_KEY]
      
    },
    hardhat: {
      chainId: 1337
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API,
    customChains: [  // <========================= custom chains config here
    {
      network: 'rinkeby',
      chainId: 4,
      urls: {
        apiURL: 'http://api-rinkeby.etherscan.io/api',  // https => http
        browserURL: 'https://rinkeby.etherscan.io',
      },
    },
    {
      network: 'goerli',
      chainId: 5,
      urls: {
        apiURL: 'http://api-goerli.etherscan.io/api',  // https => http
        browserURL: 'https://goerli.etherscan.io',
      },
    },
  ],
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_KEY,
    enabled: true,
  },

};
