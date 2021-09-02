require("@nomiclabs/hardhat-waffle");

const {ALCHEMY_API_KEY, ROPSTEN_PRIVATE_KEY, ROPSTEN_MNEMONIC} = require('./.setting.js');



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
  solidity: "0.8.3",
  networks: {
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      gas: 2000000,
      // accounts: [`0x${ROPSTEN_PRIVATE_KEY}`],
      accounts: {
        mnemonic: ROPSTEN_MNEMONIC
      }
    },
  },
};
