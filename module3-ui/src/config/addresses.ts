// Deployed contract addresses (POC placeholders – replace with actual deployment outputs)
// Type helper to ensure string values
export interface ContractAddresses {
  identityRegistry: string; verificationAttestor: string; reputationOracle: string; crossChainRouter: string;
}

const addresses: ContractAddresses = {
  identityRegistry: '0x0000000000000000000000000000000000001001',
  verificationAttestor: '0x0000000000000000000000000000000000001002',
  reputationOracle: '0x0000000000000000000000000000000000001003',
  crossChainRouter: '0x0000000000000000000000000000000000001004'
};

export default addresses;