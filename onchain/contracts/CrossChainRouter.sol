// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ITeleporter.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CrossChainRouter is AccessControl {
    bytes32 public constant SENDER_ROLE = keccak256("SENDER_ROLE");

    ITeleporter public teleporter;

    event VerificationRequested(bytes32 indexed requestId, address indexed user, uint256 destChainId);
    event VerificationResponse(bytes32 indexed requestId, bool verified, uint8 level);

    constructor(address teleporterAddr, address admin) {
        teleporter = ITeleporter(teleporterAddr);
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(SENDER_ROLE, admin);
    }

    function requestVerification(uint256 destChainId, address user, uint8 requestedLevel) external onlyRole(SENDER_ROLE) returns (bytes32) {
        bytes32 requestId = keccak256(abi.encodePacked(user, block.timestamp, destChainId, requestedLevel));
        bytes memory payload = abi.encode(requestId, user, requestedLevel);
        teleporter.sendMessage(destChainId, payload);
        emit VerificationRequested(requestId, user, destChainId);
        return requestId;
    }

    // For local/mock teleporter: called by teleporter mock
    function handleIncomingMessage(bytes calldata payload) external {
        // In a real implementation, access control would validate teleporter sender
        (bytes32 requestId, bool verified, uint8 level) = abi.decode(payload, (bytes32, bool, uint8));
        emit VerificationResponse(requestId, verified, level);
    }
}
