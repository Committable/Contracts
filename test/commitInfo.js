const { CommitInfo, hashCommitInfo } = require("./utils.js");



const commitInfo_0 = new CommitInfo(
    'https://github.com/aolin118/bounty_test_0',
    [
        '0x141d9634c70ef59d320cc1224a6e46a46ea7de58',
        '0x231f4d0aac73309294cdaf9deddb945017323cec'
    ]
)

const commitInfo_1 = new CommitInfo(
    'https://github.com/aolin118/bounty_test_0',
    [
        '0x341d9634c70ef59d320cc1224a6e46a46ea4de58'
    ]
)

const commitInfo_2 = new CommitInfo(
    'https://github.com/aolin118/bounty_test_1',
    [
        '0x441d2234c70ef59d320cc1224a6e46a46ea7de58',
        '0x531f4d0aac73309294cdaf9deddb945f17323cec',
        '0x631f4ddddddddd9294cdaf9deddb945017323cec',
        '0x731f4d0aaccc309294cdaf9deddb945017323cec'
    ]
)

const commitInfo_3 = new CommitInfo(
    'https://github.com/aolin118/bounty_test_1',
    [
        '0x841d2234c70ef59d320cc1224a6e46a46ea7de58',
        '0x931f4d0aac73309294cdaf9deddb945f17323cec',
        '0xa31f4ddddddddd9294cdaf9deddb945017323cec',
        '0xb31f4d0aaccc309294cdaf9deddb945017323cec'
    ]
)

module.exports = {commitInfo_0, commitInfo_1, commitInfo_2, commitInfo_3};