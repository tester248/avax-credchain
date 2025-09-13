import fs from "fs";
import path from "path";

const sharedDir = path.join(process.cwd(), "..", "shared", "onchain-artifacts");
const abisDir = path.join(sharedDir, "abis");

function loadAllNetworkArtifacts(): Record<string, any> {
  if (!fs.existsSync(sharedDir)) throw new Error("shared/onchain-artifacts directory not found");
  const files = fs.readdirSync(sharedDir).filter(f => f.endsWith('.json'));
  const artifacts: Record<string, any> = {};
  for (const f of files) {
    // skip files in abis dir
    if (f === 'addresses.json') continue;
    if (f === 'local.json' || f === 'local') {
      const p = path.join(sharedDir, f);
      try { artifacts['local'] = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { console.warn(`Failed to parse ${p}: ${e}`); }
      continue;
    }
    // treat filename without extension as network key
    const key = f.replace(/\.json$/, '');
    const p = path.join(sharedDir, f);
    try {
      artifacts[key] = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      console.warn(`Failed to parse ${p}: ${e}`);
    }
  }
  return artifacts;
}

function writeAbisFromPrefixedFiles() {
  fs.mkdirSync(abisDir, { recursive: true });
  // mapping of expected contract JSON filenames (prefixed) to ABI output names
  const mapping: Record<string, string> = {
    CrossChainRouter: "CrossChainRouter.sol_CrossChainRouter.json",
    IdentityRegistry: "IdentityRegistry.sol_IdentityRegistry.json",
    VerificationAttestor: "VerificationAttestor.sol_VerificationAttestor.json",
    ReputationOracle: "ReputationOracle.sol_ReputationOracle.json",
    FeeToken: "FeeToken.sol_FeeToken.json",
    TeleporterMock: "TeleporterMock.sol_TeleporterMock.json",
    ITeleporter: "ITeleporter.sol_ITeleporter.json"
  };

  for (const [name, filename] of Object.entries(mapping)) {
    const filePath = path.join(sharedDir, filename as string);
    if (!fs.existsSync(filePath)) {
      console.warn(`ABI file for ${name} not found at ${filePath}, skipping`);
      continue;
    }
    try {
      const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      fs.writeFileSync(path.join(abisDir, `${name}.json`), JSON.stringify(obj.abi, null, 2));
      console.log(`Wrote ABI for ${name}`);
    } catch (e) {
      console.warn(`Failed to extract ABI from ${filePath}: ${e}`);
    }
  }
}

function main() {
  const all = loadAllNetworkArtifacts();
  if (Object.keys(all).length === 0) {
    console.error('No network artifact JSONs found in shared/onchain-artifacts. Run export-artifacts first.');
    process.exit(1);
  }

  const addresses: Record<string, any> = {};
  for (const [k, v] of Object.entries(all)) {
    // expected keys: teleporter, router, identityRegistry, attestor, feeToken, deployer
    addresses[k] = {
      teleporter: v.teleporter || null,
      router: v.router || v.crossChainRouter || null,
      identityRegistry: v.identityRegistry || null,
      attestor: v.attestor || null,
      feeToken: v.feeToken || v.feeToken || null,
      deployer: v.deployer || null,
      rpc: v.rpc || null,
      chainId: v.chainId || null
    };
  }

  fs.mkdirSync(sharedDir, { recursive: true });
  const outPath = path.join(sharedDir, 'addresses.json');
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log(`Wrote consolidated addresses.json with networks: ${Object.keys(addresses).join(', ')}`);

  // Extract ABIs from prefixed files into abis/
  writeAbisFromPrefixedFiles();
}

main();
