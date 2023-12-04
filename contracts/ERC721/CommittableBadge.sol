// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DEVNETBadge is ERC721, Ownable {

    string baseURI;
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_){
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function changeBaseURI(string memory baseURI_) external onlyOwner {
        baseURI = baseURI_;
    }

}