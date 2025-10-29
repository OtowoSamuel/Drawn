// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Drawn NFT (minimal)
/// @notice Simple ERC721 that allows the owner to mint NFTs with a tokenURI
contract NFT is ERC721URIStorage, Ownable {
    uint256 private _nextId = 1;

    constructor() ERC721("DrawnSticker", "DRAWN") {}

    /// @notice Mint a new NFT to `to` with `uri` metadata
    function mint(address to, string memory uri) external onlyOwner returns (uint256) {
        uint256 id = _nextId;
        _nextId++;
        _mint(to, id);
        _setTokenURI(id, uri);
        return id;
    }
}
