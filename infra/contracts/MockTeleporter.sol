// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockTeleporter {
    event MessageSent(bytes32 indexed id, address indexed sender, bytes payload);

    function sendMessage(bytes32 id, bytes calldata payload) external {
        emit MessageSent(id, msg.sender, payload);
    }
}
