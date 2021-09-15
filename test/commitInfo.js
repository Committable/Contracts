const { CommitInfo, hashCommitInfo } = require("./utils.js");



const commitInfo_0 = new CommitInfo(
    'aolin118/bounty_test_0',
    [
        '0x141d9634c70ef59d320cc1224a6e46a46ea7de58',
        '0x231f4d0aac73309294cdaf9deddb945017323cec'
    ]
)

const commitInfo_1 = new CommitInfo(
    'aolin118/bounty_test_0',
    [
        '0x341d9634c70ef59d320cc1224a6e46a46ea4de58'
    ]
)

const commitInfo_2 = new CommitInfo(
    'aolin118/bounty_test_1',
    [
        '0x441d2234c70ef59d320cc1224a6e46a46ea7de58',
        '0x531f4d0aac73309294cdaf9deddb945f17323cec',
        '0x631f4ddddddddd9294cdaf9deddb945017323cec',
        '0x731f4d0aaccc309294cdaf9deddb945017323cec'
    ]
)

const commitInfo_3 = new CommitInfo(
    'aolin118/bounty_test_1',
    [
        '0x841d2234c70ef59d320cc1224a6e46a46ea7de58',
        '0x931f4d0aac73309294cdaf9deddb945f17323cec',
        '0xa31f4ddddddddd9294cdaf9deddb945017323cec',
        '0xb31f4d0aaccc309294cdaf9deddb945017323cec'
    ]
)

const commitInfo_4 = new CommitInfo(
    'aolin118/bounty_test_1',
    [
        '0xc41d2234c70ef59d320cc1224a6e46a46ea7de58'
    ]
)
const tokenId_0 = 5042;
const tokenId_1 = '0x79217';
const tokenId_2 = '13';
const tokenId_3 = 4;
const tokenId_4 = 22222222;


commitInfo = {
    commitInfo_0: commitInfo_0,
    commitInfo_1: commitInfo_1,
    commitInfo_2: commitInfo_2,
    commitInfo_3: commitInfo_3,
    commitInfo_4: commitInfo_4,
};
tokenIds = {
    tokenId_0: tokenId_0,
    tokenId_1: tokenId_1,
    tokenId_2: tokenId_2,
    tokenId_3: tokenId_3,
    tokenId_4: tokenId_4,
}

module.exports = { commitInfo, tokenIds };