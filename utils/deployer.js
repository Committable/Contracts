const { ethers } = require("hardhat");
// const { Router } = require("react-router-dom/cjs/react-router-dom.min");



function Controller() {
    this.deploy = async function () {
        let Controller = await ethers.getContractFactory("Controller");
        let controller = await Controller.deploy(); // set signer
        await controller.deployed();
        return controller
    }
}

function ERC721Committable(BASE_URI) {
    this.deploy = async function (name, symbol, signer, distributor, controller) {
        /* deploy token logic contract */
        let ERC721Committable = await ethers.getContractFactory("ERC721Committable");
        let erc721Committable = await ERC721Committable.deploy();

        await erc721Committable.deployed();
        /* deploy token proxy contract */
        let CommittableProxy = await ethers.getContractFactory("CommittableProxy");
        let ABI = ["function initialize(string,string,address,address)"];
        let iface = new ethers.utils.Interface(ABI);
        let calldata = iface.encodeFunctionData("initialize", [name, symbol, signer, distributor]);
        CommittableProxy = await CommittableProxy.deploy(erc721Committable.address, controller.address, calldata);
        await CommittableProxy.deployed();
        /* attach proxy address with logic instance */
        let tokenProxy = ERC721Committable.attach(CommittableProxy.address)
        tokenProxy.implementation = erc721Committable.address
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
                { name: 'repoId', type: 'string' },
            ]
        }

        if (BASE_URI != null) {
            let tx = await tokenProxy.changeBaseURI(BASE_URI)
            await tx
        }

        return tokenProxy
    }
}

function Exchange(erc721Committable) {
    this.deploy = async function () {
        /* deploy exchange contract */
        let Exchange = await ethers.getContractFactory("Exchange");
        let exchange = await Exchange.deploy();
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
                { name: 'start', type: 'uint256' },
                { name: 'end', type: 'uint256' },
                { name: 'salt', type: 'uint256' },
            ]
        }
        exchange.hashOrder = function (order) {
            let abiCoder = new ethers.utils.AbiCoder();
            let order_encode =
                abiCoder.encode(['bytes32', 'bool', 'bool', 'address', 'address', 'uint256', 'address', 'uint256', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                    ['0x0e6d10e3410480287f7da74700fffd3978667772bdd833a68a905a27645320d1',
                        order.isBuySide,
                        order.isAuction,
                        order.maker,
                        order.paymentToken,
                        order.value,
                        order.royaltyRecipient,
                        order.royalty,
                        order.target,
                        order.tokenId,
                        order.start,
                        order.end,
                        order.salt
                    ]
                );
            return order_hash = ethers.utils.keccak256(order_encode);

        }
        /* approve exchange */
        // tx = await controller.approveOrCancel(exchange.address, true);
        /* register exchange */
        tx = await erc721Committable.registerOperator(exchange.address, true)
        await tx.wait();


        return exchange
    }
}



function Vault() {
    this.deploy = async function (controller) {
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
        // let tx = await exchange.changeRecipient(vault.address);
        await tx.wait()

        return vault
    }
}

function RoyaltyDistributor() {
    this.deploy = async function (erc721Committable, vault) {
        let RoyaltyDistributor = await ethers.getContractFactory("RoyaltyDistributor")
        let royaltyDistributor = await RoyaltyDistributor.deploy(erc721Committable.address, vault.address)
        await royaltyDistributor.deployed()

        let tx = await erc721Committable.changeRoyaltyDistributor(royaltyDistributor.address);
        await tx.wait()
        return royaltyDistributor
    }
}

function DevIdentity() {
    this.deploy = async function (controller) {
        let DevIdentity = await ethers.getContractFactory("DevIdentity");
        let devIdentity = await DevIdentity.deploy()
        await devIdentity.deployed()
        let implementation = devIdentity.address
        /* deploy Vault proxy contract */
        CommittableProxy = await ethers.getContractFactory("CommittableProxy");
        let ABI = ["function initialize()"];
        let iface = new ethers.utils.Interface(ABI);
        calldata = iface.encodeFunctionData("initialize");
        identityProxy = await CommittableProxy.deploy(devIdentity.address, controller.address, calldata);
        /* attach token proxy contract with logic contract abi */
        devIdentity = await DevIdentity.attach(identityProxy.address);
        devIdentity.implementation = implementation
        return devIdentity


    }
}

function DEVNETBadge() {
    this.deploy = async function (name, symbol) {
        let DEVNETBadge = await ethers.getContractFactory("DEVNETBadge")
        let devnetBadge = await DEVNETBadge.deploy(name, symbol)
        await devnetBadge.deployed()

        // let tx = await erc721Committable.changeRoyaltyDistributor(royaltyDistributor.address);
        // await tx.wait()
        return devnetBadge
    }
}

function BountyMaster() {
    this.deploy = async function (erc721Committable) {
        let BountyMaster = await ethers.getContractFactory("BountyMaster")
        let bountyMaster = await BountyMaster.deploy(erc721Committable.address)
        await bountyMaster.deployed()

        // let tx = await erc721Committable.changeRoyaltyDistributor(royaltyDistributor.address);
        // await tx.wait()
        return bountyMaster
    }
}
module.exports = { Controller, ERC721Committable, Exchange, Vault, RoyaltyDistributor, DevIdentity,  DEVNETBadge,BountyMaster  }
