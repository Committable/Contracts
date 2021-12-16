// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const controller_address = '0x82D477c25dbFC5238dB0e0C680b15E816EA8721C';
const helper_address = '0xb606d030aC9AFCdc5f37fA8e38049304F453427e';
const committable_adress = '0xaeb676387E1Af4D71A258aD31D6Fd6cd1eC554C9';
const committableV1_address = '0x2ceDC191d4bDE246e72af86E5c66EbAD9Ed16968';
const router_address = '0x7759f72A371debC182208024A3D33E287e799527'
const exchange_address = '0xe2b473735C828AFb208fBbFDCABf1AB10057a9B1';
const { hashOrder } = require('../test/utils.js');
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

  /* set fee recipient */
  // console.log("setRecipient...")
  // tx = await exchange.changeRecipient('0xaa3376682A0fF472c716E23927D4200DB69E8A9C');
  // await tx.wait()
  // let recipient = await exchange.getRecipient();
  // console.log("recipient set to: ", recipient);
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
  let order = {
    data: "0x94d008ef0000000000000000000000000000000000000000000000000000000000000000000000000000000018484bd64dd59067c76dea4a0e8e4bfdda41877a6b16dedc000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000417e2be074aa2bb768d95cfed38f1379293124d9c6768deb58d3265ba392360a784c13d4b7735c39bd6618da369d2233b39847860721737a8e3bd569b5f72e2e1d1b00000000000000000000000000000000000000000000000000000000000000"
    , end: 0
    , exchange: "0xe2b473735C828AFb208fBbFDCABf1AB10057a9B1"
    , isBuySide: false
    , maker: "0x77b249debbdc83e945941a6b20263f6f10001391"
    , paymentToken: "0xc778417E063141139Fce010982780140Aa0cD5Ab"
    , replacementPattern: "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    , royalty: 0
    , royaltyRecipient: "0x77b249debbdc83e945941a6b20263f6f10001391"
    , salt: 7282
    , start: 0
    , taker: "0x0000000000000000000000000000000000000000"
    , target: "0xaeb676387E1Af4D71A258aD31D6Fd6cd1eC554C9"
    , value: "100000000000000"
  }
  let hash = hashOrder(order);
  console.log(hash)
  // let tokenId = "0x000000000000000018484bd6816b9e3271d93fe444af876dd2f01637a8149f01"
  // let tokenId = (ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_0])));
  // let sig = "0xf55a4f3a18cdeba7d175ffc22c7a12941333f580da851d6528d73da7664b45170286dc056d3e240ba720d6b7d9185bbfc7f6abfee1f4077a6b8d337c7ad65d1a1b";
  let desiredAddress = await helper.hashOrder(order);
  console.log(desiredAddress);
  // try {
  //   tx = await exchange.cancelOrder(order)
  //   await tx.wait();
  //   throw null;
  // } catch (err) {
  //   console.log(err.message)
  // }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



