// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ITeleporter.sol";

contract TeleporterMock is ITeleporter {
    event MessageSent(uint256 destChainId, bytes payload, bytes32 indexed messageId);

    function sendMessage(uint256 destinationChainId, bytes calldata payload) external override returns (bytes32) {
        bytes32 id = keccak256(abi.encodePacked(msg.sender, destinationChainId, payload, block.timestamp));
        emit MessageSent(destinationChainId, payload, id);

        // For local testing, assume destination router is deployed on same chain and is callable via address contained in payload.
        // We expect a special payload format: abi.encode(address targetRouter, bytes innerPayload)
        // If decode fails, do nothing. This is only for local mock flows.
        try this._deliver(destinationChainId, payload) returns (bool) {
        } catch {}
        return id;
    }

    // helper that tries to decode and call target router's handleIncomingMessage
    function _deliver(uint256 destinationChainId, bytes calldata payload) external returns (bool) {
        // decode target and inner
        // expected: abi.encode(address targetRouter, bytes innerPayload)
        (address target, bytes memory inner) = abi.decode(payload, (address, bytes));
        // call target.handleIncomingMessage(inner)
        (bool ok, ) = target.call(abi.encodeWithSignature("handleIncomingMessage(bytes)", inner));
        return ok;
    }
}
