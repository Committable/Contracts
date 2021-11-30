// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  /* deploy controller contract */
  console.log('waiting for deployment: Controller...')
  let Controller = await ethers.getContractFactory("Controller");
  controller = await Controller.deploy();
  await controller.deployed();
  console.log("controller deployed to:", controller.address);
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
  let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
  committable = await Committable.deploy(committableV1.address, controller.address, calldata);
  await committable.deployed();
  console.log("Committable deployed to:", committable.address);
  /* deploy router contract */
  console.log('waiting for deployment: Router')
  let Router = await ethers.getContractFactory("Router");
  router = await Router.deploy(controller.address);
  await router.deployed();
  console.log("router deployed to:", router.address);
  /* deploy exchange contract */
  console.log('waiting for deployment: Exchange...')
  let Exchange = await ethers.getContractFactory("Exchange");
  exchange = await Exchange.deploy(controller.address);
  await exchange.deployed();
  console.log("exchange deployed to:", exchange.address);
  /* initialize contracts */
  console.log("setDefaultRouter...")
  tx = await controller.setDefaultRouter(router.address);
  await tx.wait();
  let defaultRouter = await controller.defaultRouter();
  console.log("default rouer set to: ", defaultRouter);
  console.log("setRecipient...")
  tx = await exchange.changeRecipient('0x92E0a5c7d7D806cD48Db15e220DC4440185b0787');
  await tx.wait()
  let recipient = await exchange.getRecipient();
  console.log("recipient set to: ", recipient);
  console.log("setSigner...")
  tx = await controller.setSigner('0x95EC7c60F2150cb9CCdbc942278CfD71f0a47024');
  await tx.wait()
  let signer = await controller.signer();
  console.log("signer set to: ", signer);
  console.log("approve exchange...");
  tx = await controller.approveOrCancel(exchange.address, true);
  await tx.wait();
  console.log("exchange has been approved?: ", await controller.isApproved(exchange.address));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



