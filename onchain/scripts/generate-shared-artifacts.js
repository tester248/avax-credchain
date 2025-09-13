const fs = require('fs');
const path = require('path');

const sharedDir = path.join(process.cwd(), '..', 'shared', 'onchain-artifacts');
const abisDir = path.join(sharedDir, 'abis');

function loadLocalAddresses() {
  const localPath = path.join(sharedDir, 'local.json');
  if (!fs.existsSync(localPath)) throw new Error('local.json not found in shared/onchain-artifacts');
  return JSON.parse(fs.readFileSync(localPath, 'utf8'));
}

function main() {
  fs.mkdirSync(abisDir, { recursive: true });
  const local = loadLocalAddresses();

  const addresses = {
    teleporter: local.teleporter,
    router: local.router,
    identityRegistry: local.identityRegistry,
    attestor: local.attestor,
    feeToken: local.feeToken || null,
    deployer: local.deployer
  };
  fs.writeFileSync(path.join(sharedDir, 'addresses.json'), JSON.stringify(addresses, null, 2));
  console.log('Wrote shared/onchain-artifacts/addresses.json');

  const mapping = {
    CrossChainRouter: 'CrossChainRouter.sol_CrossChainRouter.json',
    IdentityRegistry: 'IdentityRegistry.sol_IdentityRegistry.json',
    VerificationAttestor: 'VerificationAttestor.sol_VerificationAttestor.json',
    ReputationOracle: 'ReputationOracle.sol_ReputationOracle.json',
    FeeToken: 'FeeToken.sol_FeeToken.json',
    TeleporterMock: 'TeleporterMock.sol_TeleporterMock.json',
    ITeleporter: 'ITeleporter.sol_ITeleporter.json'
  };

  for (const name of Object.keys(mapping)) {
    const filename = mapping[name];
    const filePath = path.join(sharedDir, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`ABI file for ${name} not found at ${filePath}, skipping`);
      continue;
    }
    const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    fs.writeFileSync(path.join(abisDir, `${name}.json`), JSON.stringify(obj.abi, null, 2));
    console.log(`Wrote ABI for ${name}`);
  }
}

main();
