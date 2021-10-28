const { CommitInfo, hashCommitInfo } = require("./utils.js");
const { ethers } = require('hardhat');

const project_0 = '0xaaaaaaaa';
const project_1 = '0xbbbbbbbbbbbbbbbbbbbbbbbb';

const commit_0 = '0x041d9634c70ef59d320cc1224a6e46a46ea7de58';
const commit_1 = '0x131f4d0aac73309294cdaf9deddb945017323cec';
const commit_2 = '0x241d9634c70ef59d320cc1224a6e46a46ea4de58';
const commit_3 = '0x341d2234c70ef59d320cc1224a6e46a46ea7de58';
const commit_4 = '0x431f4d0aac73309294cdaf9deddb945f17323cec';
const commit_5 = '0x521f4d0aac73309294cdaf9deddb945f17323ced';




const tokenId_0 = ethers.utils.hexConcat([project_0, commit_0]);
const tokenId_1 = ethers.utils.hexConcat([project_0, commit_1]);
const tokenId_2 = ethers.utils.hexConcat([project_1, commit_2]);
const tokenId_3 = ethers.utils.hexConcat([project_1, commit_3]);
const tokenId_4 = ethers.utils.hexConcat([project_1, commit_4]);
const tokenId_5 = ethers.utils.hexConcat([project_1, commit_5]);


projects = {
    project_0: project_0,
    project_1: project_1
}
commits = {
    commit_0: commit_0,
    commit_1: commit_1,
    commit_2: commit_2,
    commit_3: commit_3,
    commit_4: commit_4,
    commit_5: commit_5


}
tokenIds = {
    tokenId_0: tokenId_0,
    tokenId_1: tokenId_1,
    tokenId_2: tokenId_2,
    tokenId_3: tokenId_3,
    tokenId_4: tokenId_4,
    tokenId_5: tokenId_5
}

module.exports = { projects, commits, tokenIds };