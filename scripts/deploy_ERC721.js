// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const controller_address = '0x8553357ab4aD7f7fBBF6b7A490A88dAa3b4870f6';

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  /* deploy token logic contract */
  console.log('waiting for deployment: CommittableV1...')
  let CommittableV1 = await ethers.getContractFactory("CommittableV1");
  committableV1 = await CommittableV1.deploy();
  await committableV1.deployed();
  console.log("CommittableV1 deployed to:", committableV1.address);
  /* deploy token proxy contract */
  console.log('waiting for deployment: Committable...')
  let Committable = await ethers.getContractFactory("Committable");
  let ABI = ["function initialize(string,string,address)"];
  let iface = new ethers.utils.Interface(ABI);
  let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller_address]);
  committable = await Committable.deploy(committableV1.address, controller_address, calldata);
  await committable.deployed();
  console.log("Committable deployed to:", committable.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



