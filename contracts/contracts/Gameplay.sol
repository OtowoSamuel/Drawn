// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Gameplay logic (placeholder)
/// @notice Holds minimal hooks for gameplay — expand with project rules and state.
contract Gameplay is Ownable {
    // Example: map tokenId => score
    mapping(uint256 => uint256) public scores;

    event ScoreUpdated(uint256 indexed tokenId, uint256 newScore);

    function setScore(uint256 tokenId, uint256 score) external onlyOwner {
        scores[tokenId] = score;
        emit ScoreUpdated(tokenId, score);
    }
}
