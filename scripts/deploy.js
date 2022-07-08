
const { ethers } = require("hardhat");
const { NAME, SYMBOL, SIGNER_ADDRESS } = require('../.config.js');
const { Controller, ERC721Committable, Exchange, TransferProxy, PayrollPool, Vault } = require("../utils/deployer.js")





async function main() {

  let controller = await new Controller(SIGNER_ADDRESS).deploy()
  let erc721Committable = await new ERC721Committable(NAME, SYMBOL, controller).deploy()
  let exchange = new Exchange().deploy(controller);
  let transferProxy = new TransferProxy().deploy(controller)
  let payrollPool = new PayrollPool().deploy(controller)
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

