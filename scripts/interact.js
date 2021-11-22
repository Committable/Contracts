// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const controller_address = '0xB90EDA1295e35115D19a138cdC3A697D59eD87b0';
const helper_address = '0x67886c1203aAFC191Cbf878454D73b2825783dd1';
// const exchange_address = '0x37e281C8238FEe521D0592509eCF0Cd44175A9B5';
// const tokenProxy_address = '0x02dAbB18416087d26D62cEF630Dc3Dd4DB5754bd';
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

  // console.log(signer.address)
  // We get the contract to interact
  const Controller = await ethers.getContractFactory("Controller");
  const controller = await Controller.connect(signer).attach(controller_address);

  const Helper = await ethers.getContractFactory("Helper");
  const helper = await Helper.attach(helper_address);

  const privateKey = '0x1803fa7d492feb71b99e3d39df8478263f969b624e05a7daadf2e6c3116b237f';
  const tokenSigner = await new ethers.Wallet(privateKey);
  const tokenId = "0x000000000000000018484bd64dd59067c76dea4a0e8e4bfdda41877a6b16dedc";
  // const tokenSig = await tokenSigner.signMessage(ethers.utils.arrayify(tokenId));
  const tokenSig = '0x7e2be074aa2bb768d95cfed38f1379293124d9c6768deb58d3265ba392360a784c13d4b7735c39bd6618da369d2233b39847860721737a8e3bd569b5f72e2e1d1b';
  // console.log("arrayify tokenId is: ", ethers.utils.arrayify(tokenId))
  console.log(tokenSigner.address)
  console.log(tokenSig)

  // console.log(tokenProxy);
  // do sth
  // let tokenId = '0x0000000000000000000000006d193b90ef6cb2128eb6b85c22ea38c683824652'
  
  const hash = '0x000000000000000018484bd64dd59067c76dea4a0e8e4bfdda41877a6b16dedc';
  console.log("current signer: ", await controller['signer()']());
  console.log("recovered address: ", await helper.recover(hash, tokenSig));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



