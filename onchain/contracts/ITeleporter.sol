// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITeleporter {
    function sendMessage(uint256 destinationChainId, bytes calldata payload) external returns (bytes32);
}
