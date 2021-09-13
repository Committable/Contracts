
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const old_exchange_address = '0x7c63d26347dFeaBD11FD93776C6A7D783f57d11f';
const controller_address = '0x50CD7c242aCc7F803b4322d6Cf9C5b3Ba732582f';

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // console.log(accounts);
    [owner, user] = await ethers.getSigners();


    // We get the contract to interact
    const Exchange = await ethers.getContractFactory("Exchange");
    const exchange = await Exchange.deploy(controller_address);
    await exchange.deployed();
    console.log("exchange deployed to:", exchange.address);

    // do sth
    const Controller = await ethers.getContractFactory("Controller");
    const controller = await Controller.attach(controller_address);
    let tx = await controller.grantAuthentication(exchange.address);
    await tx.wait();
    console.log("grant exchange contract: ", exchange.address);
    console.log("is new exchange address is authenticated: ", await controller.contracts(exchange.address));

    tx = await controller.revokeAuthentication(old_exchange_address);
    await tx.wait();
    console.log("revoke exchange contract: ", old_exchange_address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
