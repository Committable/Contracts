// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const controller_address = '0xBb16c643346d17D1330b477789a64316b5ae08C5';
const exchange_address = '0x37e281C8238FEe521D0592509eCF0Cd44175A9B5';
const tokenProxy_address = '0x02dAbB18416087d26D62cEF630Dc3Dd4DB5754bd';
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
  [signer, user] = await ethers.getSigners();

  console.log(signer.address)
  // We get the contract to interact
  const OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
  const tokenProxy = await OxERC721Upgradeable.connect(signer).attach(tokenProxy_address);

  // console.log(tokenProxy);
  // do sth
  let tokenId = '0x0000000000000000000000006d193b90ef6cb2128eb6b85c22ea38c683824652'
  console.log(await tokenProxy.ownerOf('0x0000000000000000000000006d193b90ef6cb2128eb6b85c22ea38c683824652'));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



