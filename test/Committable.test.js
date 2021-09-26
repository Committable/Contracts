const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;
const { projects, commits, tokenIds } = require('./tokenId.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3 } = tokenIds;
const { project_0, project_1 } = projects;
const { commit_0, commit_1, commit_2, commit_3 } = commits;

describe('Committable', function () {
    context('with deployed contracts', function () {
        beforeEach('deploy contracs', async function () {
            /* get signers */
            [signer, user, ...others] = await ethers.getSigners();
            /* deploy controller contract */
            Controller = await ethers.getContractFactory("Controller");
            controller = await Controller.deploy();
            await controller.deployed();
            /* deploy token logic contract */
            OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
            oxERC721Upgradeable = await OxERC721Upgradeable.deploy();
            await oxERC721Upgradeable.deployed();
            await controller.deployed();
            /* deploy token proxy contract */
            let TokenProxy = await ethers.getContractFactory("TokenProxy");
            let ABI = ["function initialize(string,string,address)"];
            let iface = new ethers.utils.Interface(ABI);
            let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
            tokenProxy = await TokenProxy.deploy(oxERC721Upgradeable.address, controller.address, calldata);
            await tokenProxy.deployed();
            /* attach token proxy contract with logic contract abi */
            tokenProxy = await OxERC721Upgradeable.attach(tokenProxy.address);
        })

        context('with legitimate signature', function () {
            beforeEach('mint tokens with legitimate signature', async function () {
                /* sign some tokenId */
                let abiCoder = new ethers.utils.AbiCoder;
                let signature_0 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_0])));
                let signature_1 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_1])));
                let signature_2 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_2])));
                let signature_3 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_3])));
                /* mint tokenId_0, tokenId_1, tokenId_2 to signer, tokenId_3 to user */
                await tokenProxy.mint(signer.address, tokenId_0, signature_0);
                await tokenProxy.mint(signer.address, tokenId_1, signature_1);
                await tokenProxy.mint(signer.address, tokenId_2, signature_2);
                await tokenProxy.mint(user.address, tokenId_3, signature_3);
            })
            context('with legitimate behaviors', function () {
                it('should return commit by tokenId', async function () {
                    expect(await tokenProxy.commitOf(tokenId_0)).to.equal(commit_0);
                    expect(await tokenProxy.commitOf(tokenId_1)).to.equal(commit_1);
                    expect(await tokenProxy.commitOf(tokenId_2)).to.equal(commit_2);
                    expect(await tokenProxy.commitOf(tokenId_3)).to.equal(commit_3);
                })
                it('should return project by tokenId', async function () {
                    expect(await tokenProxy.projectOf(tokenId_0)).to.equal(project_0);
                    expect(await tokenProxy.projectOf(tokenId_1)).to.equal(project_0);
                    expect(await tokenProxy.projectOf(tokenId_2)).to.equal(project_1);
                    expect(await tokenProxy.projectOf(tokenId_3)).to.equal(project_1);
                })
                it('should return token supply of project', async function () {
                    expect(await tokenProxy.totalSupplyOfProject(project_0)).to.equal('2');
                    expect(await tokenProxy.totalSupplyOfProject(project_1)).to.equal('2');
                })
                it('should return tokenId of project by index', async function () {
                    expect(await tokenProxy.tokenOfProjectByIndex(project_0, 0)).to.equal(tokenId_0);
                    expect(await tokenProxy.tokenOfProjectByIndex(project_0, 1)).to.equal(tokenId_1);
                    expect(await tokenProxy.tokenOfProjectByIndex(project_1, 0)).to.equal(tokenId_2);
                    expect(await tokenProxy.tokenOfProjectByIndex(project_1, 1)).to.equal(tokenId_3);
                })
            })
        })

        context('with malicious signature', function () {
            it('should revert if tokenId and signature do not match', async function () {
                try {
                    let abiCoder = new ethers.utils.AbiCoder;
                    let signature_0 = await signer.signMessage(ethers.utils.arrayify(abiCoder.encode(['uint256'], [tokenId_0])));
                    await tokenProxy.mint(signer.address, tokenId_1, signature_0);
                    throw null;
                } catch (err) {
                    expect(err.message).to.include("invalid token signature");
                }
            })
        })



    })





})