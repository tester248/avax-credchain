// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract IdentityRegistry is AccessControl {
    bytes32 public constant HR_ROLE = keccak256("HR_ROLE");

    struct Identity {
        address owner;
        string jurisdiction;
        string ipfsCid; // pointer to encrypted PII
        bool consent;
    }

    mapping(address => Identity) private identities;

    event IdentityRegistered(address indexed user, string jurisdiction, string ipfsCid);
    event IdentityUpdated(address indexed user, string ipfsCid);
    event ConsentUpdated(address indexed user, bool consent);

    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(HR_ROLE, admin);
    }

    function registerIdentity(address user, string calldata jurisdiction, string calldata ipfsCid) external onlyRole(HR_ROLE) {
        identities[user] = Identity({ owner: user, jurisdiction: jurisdiction, ipfsCid: ipfsCid, consent: true });
        emit IdentityRegistered(user, jurisdiction, ipfsCid);
    }

    function updateIdentity(address user, string calldata ipfsCid) external onlyRole(HR_ROLE) {
        identities[user].ipfsCid = ipfsCid;
        emit IdentityUpdated(user, ipfsCid);
    }

    function updateConsent(address user, bool consent) external {
        require(msg.sender == user || hasRole(HR_ROLE, msg.sender), "Not authorized");
        identities[user].consent = consent;
        emit ConsentUpdated(user, consent);
    }

    function getIdentity(address user) external view returns (string memory jurisdiction, string memory ipfsCid, bool consent) {
        Identity storage id = identities[user];
        return (id.jurisdiction, id.ipfsCid, id.consent);
    }
}
