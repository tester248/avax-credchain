// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract VerificationAttestor is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct Attestation {
        bytes32 id;
        address user;
        uint8 level;
        string metadataCID;
        address verifier;
    }

    mapping(bytes32 => Attestation) public attestations;

    event AttestationCreated(bytes32 indexed id, address indexed user, uint8 level, address verifier);

    address public reputationOracle;

    constructor(address admin, address _reputationOracle) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(VERIFIER_ROLE, admin);
        reputationOracle = _reputationOracle;
    }

    function createAttestation(address user, bytes32 attHash, uint8 level, string calldata metadataCID) external onlyRole(VERIFIER_ROLE) returns (bytes32) {
        bytes32 id = keccak256(abi.encodePacked(attHash, block.timestamp, user));
        attestations[id] = Attestation({ id: id, user: user, level: level, metadataCID: metadataCID, verifier: msg.sender });
        emit AttestationCreated(id, user, level, msg.sender);
        // optionally notify reputation oracle
        if (reputationOracle != address(0)) {
            try IReputationOracle(reputationOracle).increaseReputation(msg.sender, 1) {
            } catch {}
        }
        return id;
    }
}

// Minimal interface to call the oracle without importing
abstract contract IReputationOracle {
    function increaseReputation(address verifier, uint256 amount) external virtual;
}
