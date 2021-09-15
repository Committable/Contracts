const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');
const { NAME, SYMBOL } = require('../.config.js');
const { ZERO_ADDRESS } = constants;
const { CommitInfo, hashCommitInfo } = require("./utils.js");
const { tokenIds, commitInfo } = require('./commitInfo.js');
const { tokenId_0, tokenId_1, tokenId_2, tokenId_3} = tokenIds;
const { commitInfo_0, commitInfo_1, commitInfo_2, commitInfo_3 } = commitInfo; 
// const { commitInfo_0, commitInfo_1, commitInfo_2, commitInfo_3, tokenId_0, tokenId_1, tokenId_2, tokenId_3 } = require('./commitInfo.js');


let OxERC721Upgradeable, controller, tokenProxy;
let signer, user, others;
describe('Committable', function () {

    context('with deployed contracts and minted some tokens', function() {
        beforeEach('deploy token contracts, token proxy and controller', async function () {

            [signer, user, ...others] = await ethers.getSigners();

            OxERC721Upgradeable = await ethers.getContractFactory("OxERC721Upgradeable");
            oxERC721Upgradeable = await OxERC721Upgradeable.deploy();
            await oxERC721Upgradeable.deployed();
      
            let Controller = await ethers.getContractFactory("Controller");
            controller = await Controller.deploy();
            await controller.deployed();
      
            let TokenProxy = await ethers.getContractFactory("TokenProxy");
            let ABI = ["function initialize(string,string,address)"];
            let iface = new ethers.utils.Interface(ABI);
            let calldata = iface.encodeFunctionData("initialize", [NAME, SYMBOL, controller.address]);
            tokenProxy = await TokenProxy.deploy(oxERC721Upgradeable.address, controller.address, calldata);
            await tokenProxy.deployed();
            tokenProxy = await OxERC721Upgradeable.attach(tokenProxy.address);
            // sign some tokens commit info
            let signature_0 = await signer.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_0)));
            let signature_1 = await signer.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_1)));
            let signature_2 = await signer.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_2)));
            let signature_3 = await signer.signMessage(ethers.utils.arrayify(hashCommitInfo(commitInfo_3)));
            // mint 0, 1, 2 to signer, 3 to user
            await tokenProxy.mint(signer.address, tokenId_0, commitInfo_0, signature_0);
            await tokenProxy.mint(signer.address, tokenId_1, commitInfo_1, signature_1);
            await tokenProxy.mint(signer.address, tokenId_2, commitInfo_2, signature_2);
            await tokenProxy.mint(user.address, tokenId_3, commitInfo_3, signature_3);

        })

        context('with legitimate behaviors', function() {
            it('should return project by tokenId', async function() {
                expect(await tokenProxy.projectOf(tokenId_0)).to.equal(commitInfo_0.project);
                expect(await tokenProxy.projectOf(tokenId_1)).to.equal(commitInfo_1.project);
                expect(await tokenProxy.projectOf(tokenId_2)).to.equal(commitInfo_2.project);
                expect(await tokenProxy.projectOf(tokenId_3)).to.equal(commitInfo_3.project);
            })
            it('should return token supply of project', async function() {
                let project_0 = commitInfo_0.project;
                let project_1 = commitInfo_2.project;
                expect(await tokenProxy.totalSupplyOfProject(project_0)).to.equal('2');
                expect(await tokenProxy.totalSupplyOfProject(project_1)).to.equal('2');
            })
            it('should return tokenId of project by index', async function() {
                let project_0 = commitInfo_0.project;
                let project_1 = commitInfo_2.project;
                expect(await tokenProxy.tokenOfProjectByIndex(project_0, 0)).to.equal(tokenId_0);
                expect(await tokenProxy.tokenOfProjectByIndex(project_0, 1)).to.equal(tokenId_1);
                expect(await tokenProxy.tokenOfProjectByIndex(project_1, 0)).to.equal(tokenId_2);
                expect(await tokenProxy.tokenOfProjectByIndex(project_1, 1)).to.equal(tokenId_3);
            })
            it('should return tokenId of commit', async function() {
                for(let i = 0; i < commitInfo_0.commits.length; ++i) {
                    expect(await tokenProxy.tokenOfCommit(commitInfo_0.commits[i])).to.equal(tokenId_0);
                }
                for(let i = 0; i < commitInfo_1.commits.length; ++i) {
                    expect(await tokenProxy.tokenOfCommit(commitInfo_1.commits[i])).to.equal(tokenId_1);
                }
                for(let i = 0; i < commitInfo_2.commits.length; ++i) {
                    expect(await tokenProxy.tokenOfCommit(commitInfo_2.commits[i])).to.equal(tokenId_2);
                }
                for(let i = 0; i < commitInfo_3.commits.length; ++i) {
                    expect(await tokenProxy.tokenOfCommit(commitInfo_3.commits[i])).to.equal(tokenId_3);
                }
            })
            it('should return commit supply of token', async function() {
                expect(await tokenProxy.commitSupplyOfToken(tokenId_0)).to.equal(commitInfo_0.commits.length);
                expect(await tokenProxy.commitSupplyOfToken(tokenId_1)).to.equal(commitInfo_1.commits.length);
                expect(await tokenProxy.commitSupplyOfToken(tokenId_2)).to.equal(commitInfo_2.commits.length);
                expect(await tokenProxy.commitSupplyOfToken(tokenId_3)).to.equal(commitInfo_3.commits.length);
            })
            it('should return commit of token by index', async function() {
                for(let i = 0; i < commitInfo_0.commits.length; ++i) {
                    expect(await tokenProxy.commitOfTokenByIndex(tokenId_0, i)).to.equal(commitInfo_0.commits[i]);
                }
                for(let i = 0; i < commitInfo_1.commits.length; ++i) {
                    expect(await tokenProxy.commitOfTokenByIndex(tokenId_1, i)).to.equal(commitInfo_1.commits[i]);
                }
                for(let i = 0; i < commitInfo_2.commits.length; ++i) {
                    expect(await tokenProxy.commitOfTokenByIndex(tokenId_2, i)).to.equal(commitInfo_2.commits[i]);
                }
                for(let i = 0; i < commitInfo_3.commits.length; ++i) {
                    expect(await tokenProxy.commitOfTokenByIndex(tokenId_3, i)).to.equal(commitInfo_3.commits[i]);
                }  
            })
        })
    })
    


})