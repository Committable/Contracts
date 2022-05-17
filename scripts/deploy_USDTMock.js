// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const fs = require('fs')
// deployed to 0xeA459814c304530c36E579dA319dbF1AE86dfF97 (21 Feb)
async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  /* deploy controller contract */
  // console.log('waiting for deployment: USDTMock...')
  // let USDTMock = await ethers.getContractFactory("USDTMock");
  // usdt = await USDTMock.deploy("USDTMock", "USDT-M");
  // await usdt.deployed();
  // console.log("USDTMock deployed to:", usdt.address);
  let address = "0xD2856Dfc2948711B1659FaaBcb200e0717470E2A"
  let content = "\n******Deploying at: " + Date().toLocaleString() +
  "\nUSDTMock: " + address
  fs.appendFileSync("docs/addressList.txt", content)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


  
