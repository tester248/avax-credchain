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

    // EERC Encryption Support
    mapping(address => mapping(string => string)) private encryptedData;
    mapping(address => string[]) private encryptedFields;
    
    event EncryptedDataStored(
        address indexed user,
        string indexed fieldName,
        uint256 timestamp
    );
    
    event EncryptedDataAccessed(
        address indexed user,
        address indexed accessor,
        string indexed fieldName,
        uint256 timestamp
    );
    
    /**
     * Store encrypted data for a user
     * @param user The user address
     * @param fieldName The field being encrypted (e.g., "ssn", "medicalLicense")
     * @param encryptedPayload The EERC-encrypted data
     */
    function storeEncryptedData(
        address user,
        string memory fieldName,
        string memory encryptedPayload
    ) external onlyRole(HR_ROLE) {
        require(identities[user].user != address(0), "Identity not registered");
        
        // Store encrypted data
        encryptedData[user][fieldName] = encryptedPayload;
        
        // Track encrypted fields for this user
        bool fieldExists = false;
        for (uint i = 0; i < encryptedFields[user].length; i++) {
            if (keccak256(abi.encodePacked(encryptedFields[user][i])) == keccak256(abi.encodePacked(fieldName))) {
                fieldExists = true;
                break;
            }
        }
        
        if (!fieldExists) {
            encryptedFields[user].push(fieldName);
        }
        
        emit EncryptedDataStored(user, fieldName, block.timestamp);
    }
    
    /**
     * Retrieve encrypted data (only by authorized roles)
     * @param user The user address
     * @param fieldName The encrypted field name
     */
    function getEncryptedData(
        address user,
        string memory fieldName
    ) external view onlyRole(DEFAULT_ADMIN_ROLE) returns (string memory) {
        require(identities[user].user != address(0), "Identity not registered");
        return encryptedData[user][fieldName];
    }
    
    /**
     * Get list of encrypted fields for a user
     */
    function getEncryptedFields(address user) external view returns (string[] memory) {
        require(
            identities[user].user != address(0) || 
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return encryptedFields[user];
    }
    
    /**
     * Check if user has encrypted data
     */
    function hasEncryptedData(address user) external view returns (bool) {
        return encryptedFields[user].length > 0;
    }

}
