
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const controller_address = '0xd8d5502D907E41De5ac1fA1b129812da53eF4a7a';

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
    const AirdropPool = await ethers.getContractFactory("AirdropPool");
    const airdropPool = await AirdropPool.deploy(controller_address);
    await airdropPool.deployed();
    console.log("airdropPool deployed to:", airdropPool.address);

  

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
