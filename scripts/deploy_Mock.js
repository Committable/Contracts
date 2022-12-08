
const { ethers } = require("hardhat");
const { NAME, SYMBOL, SIGNER_ADDRESS, BASE_URI} = require('../.config.js');
const { Controller, ERC721Committable, Exchange, TransferProxy, Vault, RoyaltyDistributor } = require("../utils/deployer.js")

const fs = require("fs")



async function main() {

  console.log("deploying controller...")
  let controller = await new Controller().deploy(SIGNER_ADDRESS)

  console.log("deploying erc721Committable...")
  let erc721CommittableMock = await new ERC721CommittableMock(BASE_URI).deploy(NAME, SYMBOL, controller)

  console.log("deploying exchange...")
  let exchange = await new Exchange().deploy(controller);

  console.log("deploying transferProxy...")
  let transferProxy = await new TransferProxy().deploy(controller)

  console.log("deploying vault...")
  let vault = await new Vault().deploy(controller, exchange)

  console.log("deploying royaltyDistributor...")
  let royaltyDistributor = await new RoyaltyDistributor().deploy(erc721Committable, vault, controller)

  let content =
    "\n******Deploying at: " + Date().toLocaleString() +"************************************"
    + "\nController: " + controller.address
    + "\nERC721CommittableMock: " + erc721CommittableMock.address
    + "\nTransferProxy: " + transferProxy.address
    + "\nExchange: " + exchange.address
    + "\nVault: " + vault.address
    + "\nRoyaltyDistributor: " + royaltyDistributor.address

    
  fs.writeFileSync("docs/addressList.txt", content)
  fs.appendFileSync("docs/details/deploymentRecord.txt", content)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
