// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const controller_address = '0xBb16c643346d17D1330b477789a64316b5ae08C5';
const exchange_address = '0x37e281C8238FEe521D0592509eCF0Cd44175A9B5'
async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // get provider accounts
  const accounts = await ethers.provider.listAccounts();
  // console.log(accounts);
  [owner, user] = await ethers.getSigners();

  console.log(owner.address)
  // We get the contract to interact
  const Controller = await ethers.getContractFactory("Controller");
  const controller = await Controller.attach(controller_address);
  console.log("Signer address is: ", controller.signer.address);
  console.log("controller deployed to:", controller.address);

  // do sth
  console.log("transferProxy address is: ", await controller.transferProxy());
  console.log(`exchange address of ${exchange_address} is: ` ,await controller.contracts(exchange_address))

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



