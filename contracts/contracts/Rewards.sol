// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Rewards manager (placeholder)
/// @notice Simple reward distribution mapping — expand to your token/treasury logic.
contract Rewards is Ownable {
    mapping(address => uint256) public pendingRewards;

    event RewardAllocated(address indexed user, uint256 amount);

    function allocateReward(address user, uint256 amount) external onlyOwner {
        pendingRewards[user] += amount;
        emit RewardAllocated(user, amount);
    }

    function claim() external {
        uint256 amt = pendingRewards[msg.sender];
        require(amt > 0, "No rewards");
        pendingRewards[msg.sender] = 0;
        // In a real contract you would transfer tokens/ETH here
    }
}
