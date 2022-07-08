
const { ethers } = require("hardhat");
const { NAME, SYMBOL, SIGNER_ADDRESS } = require('../.config.js');
const { Controller, ERC721Committable, Exchange, TransferProxy, PayrollPool, Vault } = require("../utils/deployer.js")





async function main() {

  console.log("deploying controller...")
  let controller = await new Controller().deploy(SIGNER_ADDRESS)

  console.log("deploying erc721Committable...")
  let erc721Committable = await new ERC721Committable().deploy(NAME, SYMBOL, controller)

  console.log("deploying exchange...")
  let exchange = new Exchange().deploy(controller);

  console.log("deploying transferProxy...")
  let transferProxy = new TransferProxy().deploy(controller)

  console.log("deploying payrollPool...")
  let payrollPool = new PayrollPool().deploy(controller)

  console.log("deploying vault...")
  let vault = new Vault().deploy(controller, exchange)

  let content =
    "\n******Deploying at: " + Date().toLocaleString()
    + "\nController: " + controller.address
    + "\nERC721Committable: " + erc721Committable.address
    + "\nTransferProxy: " + transferProxy.address
    + "\nExchange: " + exchange.address
    + "\nPayrollPool: " + payrollPool.address
    + "\nVault: " + vault.address
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

