Subnet templates for CredentialChain infra

This folder contains example subnet genesis templates for each jurisdiction. These are starter files with clearly marked placeholders. Update values before deploying.

Structure
- `us/` - US subnet genesis + metadata
- `eu/` - EU subnet genesis + metadata
- `in/` - India subnet genesis + metadata (permissioned template, geofencing: IN)

Notes on India & PII:
- For India-specific flows (Aadhaar), do NOT store raw identifiers on-chain.
- Use off-chain anonymization/tokenization (e.g. anon-aadhaar) in your vault pipeline before storing pointers on-chain. Obtain legal sign-off before any real-data testing.
