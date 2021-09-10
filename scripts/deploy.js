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
  console.log('waiting for deployment: OxERC721Upgradeable...')
  OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
  oxERC721Upgradeable = await OxERC721Upgradeable.deploy();
  await oxERC721Upgradeable.deployed();
  console.log("oxERC721Upgradeable deployed to:", oxERC721Upgradeable.address);

  console.log('waiting for deployment: ProxyController...')
  let ProxyController = await ethers.getContractFactory("ProxyController");
  proxyController = await ProxyController.deploy();
  await proxyController.deployed();
  console.log("proxyController deployed to:", proxyController.address);

  console.log('waiting for deploymentdeployment: TokenProxy...')
  let TokenProxy = await ethers.getContractFactory("TokenProxy");
  let ABI = ["function initialize(string,string,address)"];
  let iface = new ethers.utils.Interface(ABI);
  let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, proxyController.address]);
  tokenProxy = await TokenProxy.deploy(oxERC721Upgradeable.address, proxyController.address, calldata);
  await tokenProxy.deployed();
  tokenProxy = await OxERC721Upgradeable.attach(tokenProxy.address);
  console.log("tokenProxy deployed to:", tokenProxy.address);

  console.log('waiting for deployment: TransferProxy...')
  let TransferProxy = await ethers.getContractFactory("TransferProxy");
  transferProxy = await TransferProxy.deploy(proxyController.address);
  await transferProxy.deployed();
  console.log("transferProxy deployed to:", transferProxy.address);

  console.log('waiting for deployment: Exchange...')
  let Exchange = await ethers.getContractFactory("Exchange");
  exchange = await Exchange.deploy(proxyController.address);
  await exchange.deployed();
  console.log("exchange deployed to:", exchange.address);

  console.log('waiting for interaction: grant exchange...')
  let tx = await proxyController.grantAuthentication(exchange.address);
  await tx.wait();
  console.log("grant exchange: ", exchange.address);

  console.log('waiting for interaction: set proxy...')
  tx = await proxyController.setProxy(transferProxy.address);
  await tx.wait();
  console.log("set transferProxy: ", transferProxy.address);


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



