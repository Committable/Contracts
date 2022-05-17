// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const fs = require("fs");
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
  controller = await Controller.deploy("0x5dA5b801E128667c496D8C2527d21895d2cf24CB"); // set signer
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
  /* deploy transferProxy contract */
  console.log('waiting for deployment: TransferProxy')
  let TransferProxy = await ethers.getContractFactory("TransferProxy");
  transferProxy = await TransferProxy.deploy(controller.address);
  await transferProxy.deployed();
  console.log("transferProxy deployed to:", transferProxy.address);
  /* enable transferProxy contract in controller */
  console.log('enable TransferProxy')
  tx = await controller.registerTransferProxy(transferProxy.address);
  await tx.wait();
  /* deploy exchange contract */
  console.log('waiting for deployment: Exchange...')
  let Exchange = await ethers.getContractFactory("Exchange");
  exchange = await Exchange.deploy(controller.address);
  await exchange.deployed();
  console.log("exchange deployed to:", exchange.address);
  /* approve exchange */
  console.log("approve exchange...");
  tx = await controller.approveOrCancel(exchange.address, true);
  await tx.wait();
  /* deploy payroll contract */
  let PayrollPool = await ethers.getContractFactory("PayrollPool");
  let payrollPool = await PayrollPool.deploy(controller.address);
  await payrollPool.deployed();
  console.log("payrollPool deployed to:", payrollPool.address);
  /* initialize contracts */
  /* set fee recipient */
  // console.log("setRecipient...")
  // tx = await exchange.changeRecipient('0x92E0a5c7d7D806cD48Db15e220DC4440185b0787');
  // await tx.wait()
  console.log("recipient set to: ", await exchange.getRecipient());

  console.log("fee set to: ", await exchange.getFee());

  console.log("signer set to: ", await controller.getSigner());

  console.log("exchange has been approved?: ", await controller.isApproved(exchange.address));

  console.log("transferProxy set to?: ", await controller.getTransferProxy());


  let content = "\nController: " + controller.address
    + "\nCommittableV1: " + committableV1.address
    + "\nCommittable: " + committable.address
    + "\nTransferProxy: " + transferProxy.address
    + "\nExchange: " + exchange.address
    + "\nPayrollPool: " + payrollPool.address;
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



