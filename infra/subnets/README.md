# Subnet Templates

Genesis configuration templates and metadata for deploying CredChain across multiple jurisdictions and regulatory environments.

## Overview

This directory contains subnet configuration templates for deploying CredChain in different geographical and regulatory contexts, each optimized for local compliance requirements.

## Structure

- **us/** - United States subnet configuration
- **eu/** - European Union subnet configuration  
- **in/** - India subnet configuration (permissioned template)

## Template Configuration

Each subnet template includes:

- Genesis block configuration
- Validator set definitions
- Network parameters and consensus settings
- Regulatory compliance configurations
- Geofencing and access control settings

## Usage

1. Select appropriate template for your jurisdiction
2. Update placeholder values with actual configuration
3. Review regulatory compliance settings
4. Deploy using Avalanche CLI tools

## Regional Considerations

### United States (us/)
- Standard permissionless configuration
- CCPA compliance features
- Financial services regulations compatibility

### European Union (eu/)
- GDPR compliance configurations
- Right to be forgotten implementations
- Data residency controls

### India (in/)
- Permissioned network template
- Data localization requirements
- Special handling for sensitive identifiers

## Security and Privacy

**Important**: For jurisdictions with strict PII regulations:

- Never store raw personal identifiers on-chain
- Use off-chain anonymization before blockchain storage
- Implement zero-knowledge proof systems where required
- Obtain proper legal clearance before deployment

**India-Specific Notes**:
- Use anonymization tools for Aadhaar integration
- Implement data localization requirements
- Ensure compliance with Digital Personal Data Protection Act

## Deployment Process

1. **Template Selection**: Choose appropriate regional template
2. **Configuration**: Update all placeholder values
3. **Legal Review**: Ensure regulatory compliance
4. **Testing**: Deploy on testnet first
5. **Production**: Deploy with proper monitoring

## Regulatory Compliance

Each template includes configuration for:

- Data protection regulations
- Cross-border data transfer restrictions
- Audit and reporting requirements
- Identity verification standards
- Financial services compliance

## Customization

Templates can be customized for:

- Specific regulatory requirements
- Performance optimization
- Security hardening
- Integration with existing systems

## Support

For deployment assistance or regulatory questions:

- Review local compliance requirements
- Consult with legal counsel for PII handling
- Test thoroughly in staging environments
- Implement proper monitoring and audit trails
