// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ReputationOracle is AccessControl {
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    // simple reputation score per verifier
    mapping(address => uint256) public reputation;

    event ReputationUpdated(address indexed verifier, uint256 newScore);

    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(UPDATER_ROLE, admin);
    }

    function increaseReputation(address verifier, uint256 amount) external onlyRole(UPDATER_ROLE) {
        reputation[verifier] += amount;
        emit ReputationUpdated(verifier, reputation[verifier]);
    }

    function getReputation(address verifier) external view returns (uint256) {
        return reputation[verifier];
    }
}
