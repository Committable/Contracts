// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const controller_address = '0x8553357ab4aD7f7fBBF6b7A490A88dAa3b4870f6';
const helper_address = '0x67886c1203aAFC191Cbf878454D73b2825783dd1';
const committable_adress = '0x2b9059EB406254c71aB9c0F90FB3be638a1147b4';
const committableV1_address = '0xF1DA55A6026D6fdddc88F73e45CB4cA35c034b3E';
const router_address = '0x7759f72A371debC182208024A3D33E287e799527'
const exchange_address = '0xB15F0d2e4a7416bdf9bb766a6ff2aB704A5E0392';
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
  [admin, user] = await ethers.getSigners();

  // console.log(signer.address)
  // We get the contract to interact
  const Controller = await ethers.getContractFactory("Controller");
  const controller = await Controller.connect(admin).attach(controller_address);

  const Helper = await ethers.getContractFactory("Helper");
  const helper = await Helper.attach(helper_address);

  const Router = await ethers.getContractFactory("Router");
  const router = await Router.attach(router_address);

  const CommittableV1 = await ethers.getContractFactory("CommittableV1");
  const committable = await CommittableV1.connect(admin).attach(committable_adress);

  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await Exchange.connect(admin).attach(exchange_address);

  let defaultRouter = await controller.getRouter(controller.address);
  console.log("default rouer set to: ", defaultRouter);
  /* set fee recipient */
  console.log("setRecipient...")
  tx = await exchange.changeRecipient('0xaa3376682A0fF472c716E23927D4200DB69E8A9C');
  await tx.wait()
  let recipient = await exchange.getRecipient();
  console.log("recipient set to: ", recipient);
  // /* set mint signer */
  // console.log("setSigner...")
  // tx = await controller.setSigner('0x95EC7c60F2150cb9CCdbc942278CfD71f0a47024');
  // await tx.wait()
  // let signer = await controller.getSigner();
  // console.log("signer set to: ", signer);
  // /* approve exchange */
  // console.log("approve exchange...");
  // tx = await controller.approveOrCancel(exchange.address, true);
  // await tx.wait();
  // console.log("exchange has been approved?: ", await controller.isApproved(exchange.address));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



