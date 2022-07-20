# Metadata

```json
// 定义元数据接口, 以下tokenId均为十进制
GET /api/meta-data?id={tokenId}

{
    "description": "commit_message, committed by [github_username](github_link) for [project_name](commit_link)", // markdown
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
            "trait_type": "Files_added",
            "value": commit_value
        },
        {
            "display_type": "number",
            "trait_type": "Files_deleted",
            "value": commit_value
        },
        {
            "display_type": "number",
            "trait_type": "Files_modified",
            "value": commit_value
        },
        {
            "display_type": "number",
            "trait_type": "Files_renamed",
            "value": commit_value
        },
       {
            "display_type": "number",
            "trait_type": "Lines_added",
            "value": commit_value
        },
      {
            "display_type": "number",
            "trait_type": "Lines_deleted",
            "value": commit_value
        },
      {
            "display_type": "number",
            "trait_type": "Sequence_src",
            "value": commit_value
        },
      {
            "display_type": "number",
            "trait_type": "Sequence_bin",
            "value": commit_value
        },
      {
            "display_type": "number",
            "trait_type": "Selection_src",
            "value": commit_value
        },
      {
            "display_type": "number",
            "trait_type": "Selection_bin",
            "value": commit_value
        },
      {
            "display_type": "number",
            "trait_type": "Loop_src",
            "value": commit_value
        },
      {
            "display_type": "number",
            "trait_type": "Loop_bin",
            "value": commit_value
        },
      {
            "display_type": "number",
            "trait_type": "Data_flow",
            "value": commit_value
        },
      {
            "display_type": "number",
            "trait_type": "Control_flow",
            "value": commit_value
        },
      {
            "display_type": "number",
            "trait_type": "Outlines_md",
            "value": commit_value
        },
      {
            "display_type": "number",
            "trait_type": "Resources_md",
            "value": commit_value
        },
    ]
}
```

示例（old version）

opensea: https://testnets.opensea.io/assets/0x4e159c13366a9c367ac57eb0ada97050b41f5e07/0

metadata: https://gateway.pinata.cloud/ipfs/QmZJ7M53QGHEQkuHXGqbekQtYnwu5KvjuDDgz5ACu9GxcK/0

