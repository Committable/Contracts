const { ethers } = require("hardhat");



function Controller() {
    this.deploy = async function (signerAddress) {
        let Controller = await ethers.getContractFactory("Controller");
        let controller = await Controller.deploy(signerAddress); // set signer
        await controller.deployed();
        return controller
    }
}

function ERC721Committable() {
    this.deploy = async function (name, symbol, controller) {
        /* deploy token logic contract */
        let ERC721Committable = await ethers.getContractFactory("ERC721Committable");
        let erc721Committable = await ERC721Committable.deploy();
        await erc721Committable.deployed();
        /* deploy token proxy contract */
        let CommittableProxy = await ethers.getContractFactory("CommittableProxy");
        let ABI = ["function initialize(string,string,address)"];
        let iface = new ethers.utils.Interface(ABI);
        let calldata = iface.encodeFunctionData("initialize", [name, symbol, controller.address]);
        CommittableProxy = await CommittableProxy.deploy(erc721Committable.address, controller.address, calldata);
        await CommittableProxy.deployed();
        /* attach proxy address with logic instance */
        let tokenProxy = ERC721Committable.attach(CommittableProxy.address)
        tokenProxy.domain =
        {
            name: 'ERC721Committable',
            version: '1',
            chainId: 1337, // hardhat chainId
            verifyingContract: tokenProxy.address // assign this value accordingly
        }
        tokenProxy.types =
        {
            Mint: [
                { name: 'creator', type: 'address' },
                { name: 'tokenId', type: 'uint256' },
            ]
        }
        return tokenProxy
    }
}
function TransferProxy() {
    this.deploy = async function (controller) {
        /* deploy transferProxy contract */
        let TransferProxy = await ethers.getContractFactory("TransferProxy");
        let transferProxy = await TransferProxy.deploy(controller.address);
        await transferProxy.deployed();
        /* enable transferProxy contract in controller */
        tx = await controller.registerTransferProxy(transferProxy.address);
        await tx.wait();
        return transferProxy
    }
}
function Exchange() {
    this.deploy = async function (controller) {
        /* deploy exchange contract */
        let Exchange = await ethers.getContractFactory("Exchange");
        let exchange = await Exchange.deploy(controller.address);
        await exchange.deployed();
        exchange.domain =
        {
            name: 'Exchange',
            version: '1',
            chainId: 1337, // hardhat chainId
            verifyingContract: exchange.address // assign this value accordingly
        }
        exchange.types =
        {
            Order: [
                { name: 'isBuySide', type: 'bool' },
                { name: 'isAuction', type: 'bool' },
                { name: 'maker', type: 'address' },
                { name: 'paymentToken', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'royaltyRecipient', type: 'address' },
                { name: 'royalty', type: 'uint256' },
                { name: 'target', type: 'address' },
                { name: 'tokenId', type: 'uint256' },
                { name: 'tokenSig', type: 'bytes' },
                { name: 'start', type: 'uint256' },
                { name: 'end', type: 'uint256' },
                { name: 'salt', type: 'uint256' },
            ]
        }


        /* approve exchange */
        tx = await controller.approveOrCancel(exchange.address, true);
        await tx.wait();
        return exchange
    }
}

function PayrollPool() {
    this.deploy = async function (controller) {
        /* deploy payroll contract */
        let PayrollPool = await ethers.getContractFactory("PayrollPool");
        let payrollPool = await PayrollPool.deploy();
        await payrollPool.deployed();
        /* deploy payroll proxy contract */
        let CommittableProxy = await ethers.getContractFactory("CommittableProxy");
        let ABI = ["function initialize(address)"];
        let iface = new ethers.utils.Interface(ABI);
        let calldata = iface.encodeFunctionData("initialize", [controller.address]);
        let payrollProxy = await CommittableProxy.deploy(payrollPool.address, controller.address, calldata);
        await payrollProxy.deployed();
        /* attach proxy contract with logic contract abi */
        payrollProxy = await PayrollPool.attach(payrollProxy.address);
        payrollProxy.domain =
        {
            name: 'PayrollPool',
            version: '1',
            chainId: 1337, // hardhat chainid
            verifyingContract: payrollProxy.address // assign this value accordingly
        }
        payrollProxy.types =
        {
            Claim: [
                { name: 'index', type: 'uint256' },
                { name: 'amount', type: 'uint256' },
                { name: 'user', type: 'address' },
            ]
        }


        return payrollProxy
    }
}

function Vault() {
    this.deploy = async function (controller, exchange) {
        /* deploy Vault logic contract */
        let Vault = await ethers.getContractFactory("Vault");
        let vault = await Vault.deploy();
        await vault.deployed();
        /* deploy Vault proxy contract */
        CommittableProxy = await ethers.getContractFactory("CommittableProxy");
        let ABI = ["function initialize()"];
        let iface = new ethers.utils.Interface(ABI);
        calldata = iface.encodeFunctionData("initialize");
        vaultProxy = await CommittableProxy.deploy(vault.address, controller.address, calldata);
        /* attach token proxy contract with logic contract abi */
        vault = await Vault.attach(vaultProxy.address);
        /* set vault address in exchange */
        let tx = await exchange.changeRecipient(vault.address);
        await tx.wait()

        return vault
    }
}

module.exports = { Controller, ERC721Committable, TransferProxy, Exchange, PayrollPool, Vault }