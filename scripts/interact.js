// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const proxyController_address = '0x50CD7c242aCc7F803b4322d6Cf9C5b3Ba732582f';
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


  // We get the contract to interact
  const ProxyController = await ethers.getContractFactory("ProxyController");
  const proxyController = await ProxyController.attach(proxyController_address);
  console.log("Signer address is: ", proxyController.signer.address);
  console.log("proxyController deployed to:", proxyController.address);

  // do sth
  let tx = await proxyController.grantAuthentication('0xaa3376682A0fF472c716E23927D4200DB69E8A9C');
  console.log(await tx.wait());
  console.log("current transferProxy address is:", await proxyController.transferProxy());

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



