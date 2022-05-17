# Metadata

```json
// 定义元数据接口, 以下tokenId均为十进制
GET /api/main/mint/meta-data?id={tokenId}

{
    "description": "commit_message, committed by [github_username](github_link) for [project_name](commit_link) with [Committable Report](report_link)", // markdown
    "external_url": committable_token_url,
    "image": token_image_url,
    "name": "COMMIT",
    "attributes": [
        {
            "trait_type": "Language",
            "value": commit_value
        },
        {
            "trait_type": "Language",
            "value": commit_value
        },
        {
            "display_type": "number",
            "trait_type": "Data Flow Transitions",
            "value": commit_value
        },
        {
            "display_type": "number",
            "trait_type": "Control Flow Transitions",
            "value": commit_value
        },
        {
            "display_type": "number",
            "trait_type": "Lines of Code",
            "value": commit_value
        },
        {
            "display_type": "number",
            "trait_type": "New Files",
            "value": commit_value
        }
    ]
}
```

示例

opensea: https://testnets.opensea.io/assets/0x4e159c13366a9c367ac57eb0ada97050b41f5e07/0

metadata: https://gateway.pinata.cloud/ipfs/QmZJ7M53QGHEQkuHXGqbekQtYnwu5KvjuDDgz5ACu9GxcK/0

