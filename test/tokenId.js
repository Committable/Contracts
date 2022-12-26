const { ethers } = require('hardhat');

// committable tokenId is combined with commit hash (20 bytes) and repo id (12 bytes)

const commit_0 = '0x041d9634c70ef59d320cc1224a6e46a46ea7de58';
const commit_1 = '0x131f4d0aac73309294cdaf9deddb945017323cec';
const commit_2 = '0x241d9634c70ef59d320cc1224a6e46a46ea4de58';
const commit_3 = '0x341d2234c70ef59d320cc1224a6e46a46ea7de58';
const commit_4 = '0x431f4d0aac73309294cdaf9deddb945f17323cec';
const commit_5 = '0x521f4d0aac73309294cdaf9deddb945f17323ced';
const commit_6 = '0x621f4d0aac73309294cdaf9deddb945f17323ced';
const commit_7 = '0x721f4d0aac73309294cdaf9deddb945f17323ced';

const repoId_a = 'R_kgDOG9XOKQ';
const repoId_b = 'R_kgDOG9XOKW';

// -------------------
// const tokenId_0 = ethers.utils.hexConcat([commit_0, project_a]);
// const tokenId_1 = ethers.utils.hexConcat([commit_1, project_b]);
// const tokenId_2 = ethers.utils.hexConcat([commit_2, project_a]);
// const tokenId_3 = ethers.utils.hexConcat([commit_3, project_a]);
// const tokenId_4 = ethers.utils.hexConcat([commit_4, project_b]);
// const tokenId_5 = ethers.utils.hexConcat([commit_5, project_a]);
// const tokenId_6 = ethers.utils.hexConcat([commit_6, project_b]);
// const tokenId_7 = ethers.utils.hexConcat([commit_6, project_a]);
const tokenId_0 = commit_0
const tokenId_1 = commit_1
const tokenId_2 = commit_2
const tokenId_3 = commit_3
const tokenId_4 = commit_4
const tokenId_5 = commit_5
const tokenId_6 = commit_6
const tokenId_7 = commit_7


repoIds = {
    repoId_a: repoId_a,
    repoId_b: repoId_b
}
commits = {
    commit_0: commit_0,
    commit_1: commit_1,
    commit_2: commit_2,
    commit_3: commit_3,
    commit_4: commit_4,
    commit_5: commit_5,
    commit_6: commit_6,
    commit_7: commit_7,
}
tokenIds = {
    tokenId_0: tokenId_0,
    tokenId_1: tokenId_1,
    tokenId_2: tokenId_2,
    tokenId_3: tokenId_3,
    tokenId_4: tokenId_4,
    tokenId_5: tokenId_5,
    tokenId_6: tokenId_6,
    tokenId_7: tokenId_7
}

module.exports = { repoIds, commits, tokenIds };