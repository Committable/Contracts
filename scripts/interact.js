// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');

const controller_address = '0xd8d5502D907E41De5ac1fA1b129812da53eF4a7a';
const helper_address = '0xb606d030aC9AFCdc5f37fA8e38049304F453427e';
const committable_adress = '0x378E528a275Cd9735837f1b14F735f88BC8661E7';
const committableV1_address = '0x2ceDC191d4bDE246e72af86E5c66EbAD9Ed16968';
const router_address = '0x7759f72A371debC182208024A3D33E287e799527'
const exchange_address = '0x48aEe3F428D7cc41555f2FeFB2d5436849e50400';
const { hashOrder, hashMint, encodeMintAndTransfer } = require('../test/utils.js');
async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // get provider accounts
  const accounts = await ethers.provider.listAccounts();
  console.log(accounts);
  [admin, secondAdmin] = await ethers.getSigners();

  console.log(secondAdmin.address)
  // We get the contract to interact
  const Controller = await ethers.getContractFactory("Controller");
  const controller = await Controller.connect(admin).attach(controller_address);

  const Helper = await ethers.getContractFactory("Helper");
  const helper = await Helper.attach(helper_address);


  // const CommittableV1 = await ethers.getContractFactory("CommittableV1");
  // const committable = await CommittableV1.connect(admin).attach(committable_adress);

  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await Exchange.connect(admin).attach(exchange_address);

  /* deploy token proxy contract */
  // console.log('waiting for deployment: Committable...')
  // let Committable = await ethers.getContractFactory("Committable");
  // let ABI = ["function initialize(string,string,address)"];
  // let iface = new ethers.utils.Interface(ABI);
  // let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller_address]);
  // committable = await Committable.deploy(committableV1_address, controller_address, calldata);
  // await committable.deployed();
  // console.log("Committable deployed to:", committable.address);

    // We get the contract to deploy
  /* deploy token logic contract */
  console.log('waiting for deployment: CommittableV1...')
  let CommittableV1 = await ethers.getContractFactory("CommittableV1");
  committableV1 = await CommittableV1.connect(secondAdmin).deploy();
  console.log(committableV1)
  await committableV1.deployed();
  console.log("CommittableV1 deployed to:", committableV1.address);
  /* deploy token proxy contract */
  console.log('waiting for deployment: Committable...')
  let Committable = await ethers.getContractFactory("Committable");
  let ABI = ["function initialize(string,string,address)"];
  let iface = new ethers.utils.Interface(ABI);
  let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller_address]);
  committable = await Committable.connect(secondAdmin).deploy(committableV1.address, controller_address, calldata);
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



