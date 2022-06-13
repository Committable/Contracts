// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { NAME, SYMBOL } = require('../.config.js');
const { projects, commits, tokenIds } = require('../test/tokenId.js');

const { tokenId_0, tokenId_1, tokenId_2, tokenId_3, tokenId_4, tokenId_5, tokenId_6, tokenId_7 } = tokenIds;

const controller_address = '0xd8d5502D907E41De5ac1fA1b129812da53eF4a7a';
const helper_address = '0xA8Ab9FB51375BBbeE25f794F5491c335Fcc177F9';
const committable_adress = '0x378E528a275Cd9735837f1b14F735f88BC8661E7';
const committableV1_address = '0x2ceDC191d4bDE246e72af86E5c66EbAD9Ed16968';
const router_address = '0x7759f72A371debC182208024A3D33E287e799527'
const exchange_address = '0x48aEe3F428D7cc41555f2FeFB2d5436849e50400';
const { hashOrder, hashMint, encodeMintAndTransfer } = require('../test/utils.js');
const usdt_address = '0xD2856Dfc2948711B1659FaaBcb200e0717470E2A'
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
  [signer, secondAdmin] = await ethers.getSigners();
  // console.log(signer.address)
  // console.log(secondAdmin.address)
  // We get the contract to interact
  const Helper = await ethers.getContractFactory("Helper")
  const helper = Helper.attach(helper_address)


  console.log(await helper.encodePayroll("21036", "199999800000000000000","0x75de29fd69b17604858078da900484d0ee085c3c"))
  // const Helper = await ethers.getContractFactory("Helper");
  // const helper = await Helper.attach(helper_address);

  // let rawSig =
  //   [
  //     '0x3045022100a9ee9fe9fbfbc733f182f8046145def0162b0b0a7aeeedb4fa1b64ff3be32c65022062b7569700bf94173846296da764256e3de507bbae6eaea0e9c376f0c1f162d0',
  //     '0x3045022100ec9fcaa104d218cd8e14f0a9662a7258f179e0eab499fa721e977c317a52798302204beeea5b6833daacf9defd64a54dd4067a8c8b24841dec12da85e18239262b95',
  //     '0x30450221009870efca526a134624a31087d9d5952ea5e2bf8c7a28941c64ec15699b0a95e502207135c71c9f335a778dd5789b3bc0fc494b2756c65e6d028c0cef54bd972b5c13'
  //   ]
  // let data =
  //   [
  //     'hello1',
  //     'hello12',
  //     'hello1'
  //   ]

  // let siganture =
  //   [
  //     '0xa9ee9fe9fbfbc733f182f8046145def0162b0b0a7aeeedb4fa1b64ff3be32c6562b7569700bf94173846296da764256e3de507bbae6eaea0e9c376f0c1f162d01c',
  //     '0xec9fcaa104d218cd8e14f0a9662a7258f179e0eab499fa721e977c317a5279834beeea5b6833daacf9defd64a54dd4067a8c8b24841dec12da85e18239262b951c',
  //     '0x9870efca526a134624a31087d9d5952ea5e2bf8c7a28941c64ec15699b0a95e57135c71c9f335a778dd5789b3bc0fc494b2756c65e6d028c0cef54bd972b5c131c'
  //   ]

  // hashed = data.map((data) => {
  //   return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data))
  // })
  // console.log(hashed[0])
  // console.log(typeof (hashed[0]))

  // console.log(await helper.toSignedMessage(hashed[0]))
  // console.log(await helper.recover(hashed[0], siganture[0]))
  // console.log(await helper.recover(hashed[1], siganture[1]))
  // console.log(await helper.recover(hashed[2], siganture[2]))


  // for (let i = 0; i++; i < signatures.length) {
  //   console.log(await helper.recover(hashed[i], signatures[i]))
  // }

  // const CommittableV1 = await ethers.getContractFactory("CommittableV1");
  // const committable = await CommittableV1.connect(admin).attach(committable_adress);

  // const Exchange = await ethers.getContractFactory("Exchange");
  // const exchange = await Exchange.connect(admin).attach(exchange_address);

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
  // console.log('waiting for deployment: CommittableV1...')
  // let CommittableV1 = await ethers.getContractFactory("CommittableV1");
  // committableV1 = await CommittableV1.connect(secondAdmin).deploy();
  // console.log(committableV1)
  // await committableV1.deployed();
  // console.log("CommittableV1 deployed to:", committableV1.address);
  // /* deploy token proxy contract */
  // console.log('waiting for deployment: Committable...')
  // let Committable = await ethers.getContractFactory("Committable");
  // let ABI = ["function initialize(string,string,address)"];
  // let iface = new ethers.utils.Interface(ABI);
  // let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller_address]);
  // committable = await Committable.connect(secondAdmin).deploy(committableV1.address, controller_address, calldata);
  // await committable.deployed();
  // console.log("Committable deployed to:", committable.address);
  // We get the contract to interact
  // const AirdropPool = await ethers.getContractFactory("AirdropPool");
  // const airdropPool = await AirdropPool.deploy(controller_address);
  // await airdropPool.deployed();
  // console.log("airdropPool deployed to:", airdropPool.address);


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



