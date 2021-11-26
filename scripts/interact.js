// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const controller_address = '0xB90EDA1295e35115D19a138cdC3A697D59eD87b0';
const helper_address = '0x67886c1203aAFC191Cbf878454D73b2825783dd1';
const committable_adress='0xAa30D69a35d9BC2c3f59949b96efeEfBD84BBC27';
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

  const Committable = await ethers.getContractFactory("CommittableV1");
  const committable = await Committable.connect(signer).attach(committable_adress);
  
  let number = new ethers.BigNumber.from('595402892662290277460423974451487721953411454995916539922');
  console.log(number)
  
  // test now
  // let tokenId = '595402891803809020812043695656932535628725694818928036897';
  // console.log(await committable.ownerOf(tokenId));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



