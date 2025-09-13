import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { resolve } from "path";

async function deployToRpc(rpcUrl: string, chainId: number | undefined, deployerKey: string, outPath: string) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(deployerKey, provider);

  // Read compiled artifacts from hardhat artifacts folder
  const artifactsDir = path.join(__dirname, "..", "artifacts");

  // Use simple ABI+bytecode loads from Hardhat artifacts
  const loadArtifact = (name: string) => {
    const jsonPath = path.join(process.cwd(), "onchain","artifacts", "contracts", `${name}.sol`, `${name}.json`);
    if (!fs.existsSync(jsonPath)) throw new Error(`Artifact not found: ${jsonPath}`);
    return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  };

  const TeleporterArtifact = loadArtifact("TeleporterMock");
  const RouterArtifact = loadArtifact("CrossChainRouter");
  const RegistryArtifact = loadArtifact("IdentityRegistry");
  const AttestorArtifact = loadArtifact("VerificationAttestor");

  // Deploy teleporter mock by default; caller may request no mock
  let teleporterAddress: string | null = null;
  const TeleporterFactory = new ethers.ContractFactory(TeleporterArtifact.abi, TeleporterArtifact.bytecode, wallet);
  const teleporter = await TeleporterFactory.deploy();
  await teleporter.deployed();
  teleporterAddress = teleporter.address;

  const RouterFactory = new ethers.ContractFactory(RouterArtifact.abi, RouterArtifact.bytecode, wallet);
  const router = await RouterFactory.deploy(teleporterAddress, wallet.address);
  await router.deployed();

  const RegistryFactory = new ethers.ContractFactory(RegistryArtifact.abi, RegistryArtifact.bytecode, wallet);
  const registry = await RegistryFactory.deploy(wallet.address);
  await registry.deployed();

  // Deploy ReputationOracle and pass into Attestor
  const OracleArtifact = loadArtifact("ReputationOracle");
  const OracleFactory = new ethers.ContractFactory(OracleArtifact.abi, OracleArtifact.bytecode, wallet);
  const oracle = await OracleFactory.deploy(wallet.address);
  await oracle.deployed();

  const AttestorFactory = new ethers.ContractFactory(AttestorArtifact.abi, AttestorArtifact.bytecode, wallet);
  const attestor = await AttestorFactory.deploy(wallet.address, oracle.address);
  await attestor.deployed();

  // Deploy FeeToken as optional fee token
  const FeeTokenArtifact = loadArtifact("FeeToken");
  const FeeTokenFactory = new ethers.ContractFactory(FeeTokenArtifact.abi, FeeTokenArtifact.bytecode, wallet);
  const feeToken = await FeeTokenFactory.deploy("CredenFee", "CRED");
  await feeToken.deployed();

  const out = {
    teleporter: teleporterAddress,
    router: router.address,
    identityRegistry: registry.address,
    attestor: attestor.address,
    deployer: wallet.address,
    rpc: rpcUrl,
    chainId: chainId,
    abis: {
      TeleporterMock: TeleporterArtifact.abi,
      CrossChainRouter: RouterArtifact.abi,
      IdentityRegistry: RegistryArtifact.abi,
      VerificationAttestor: AttestorArtifact.abi,
      ReputationOracle: OracleArtifact.abi,
      FeeToken: FeeTokenArtifact.abi
    }
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  return out;
}

async function main() {
  const infraPath = path.join(process.cwd(), "infra", "endpoints.json");
  if (!fs.existsSync(infraPath)) {
    console.error("infra/endpoints.json not found. Create it with entries for us/eu and rpc URLs.");
    process.exit(1);
  }

  const endpoints = JSON.parse(fs.readFileSync(infraPath, "utf8"));
  // Try to read infra/teleporter.json to merge teleporter addresses if endpoints
  // entries don't include them. This makes deploy-multi robust when infra keeps
  // teleporter addresses in a separate file.
  let teleporterMap: Record<string, string> = {};
  try {
    const tpPath = path.join(process.cwd(), "infra", "teleporter.json");
    if (fs.existsSync(tpPath)) {
      const raw = fs.readFileSync(tpPath, "utf8");
      teleporterMap = JSON.parse(raw) as Record<string, string>;
      console.log("Merged teleporter addresses from infra/teleporter.json")
    }
  } catch (err) {
    console.warn('Could not read infra/teleporter.json; continuing without merge')
  }
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployerKey) {
    console.error("Set DEPLOYER_PRIVATE_KEY in env to deploy to remote RPCs.");
    process.exit(1);
  }

  const artifactsDir = path.join(process.cwd(), "onchain", "artifacts");

  for (const [k, v] of Object.entries<any>(endpoints)) {
    const rpc = v.rpc;
    const chainId = v.chainId || undefined;
    const outPath = path.join(artifactsDir, `${k}.json`);
    console.log(`Deploying to network ${k} -> ${rpc}`);
    try {
      // If endpoints entry lacks teleporterAddr but infra/teleporter.json has it, use that
      const providedTeleporter = (v.teleporterAddr && v.teleporterAddr.length > 0) ? v.teleporterAddr : (teleporterMap[k] || null);
      if (providedTeleporter) {
        // Deploy contracts but do NOT deploy TeleporterMock. Use provided teleporter address.
        console.log(`Using infra-provided teleporter at ${providedTeleporter} for ${k}`);
        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const wallet = new ethers.Wallet(deployerKey, provider);

        const loadArtifact = (name: string) => {
          const jsonPath = path.join(process.cwd(), "onchain", "artifacts", "contracts", `${name}.sol`, `${name}.json`);
          if (!fs.existsSync(jsonPath)) throw new Error(`Artifact not found: ${jsonPath}`);
          return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
        };

        const RouterArtifact = loadArtifact("CrossChainRouter");
        const RegistryArtifact = loadArtifact("IdentityRegistry");
        const AttestorArtifact = loadArtifact("VerificationAttestor");
        const OracleArtifact = loadArtifact("ReputationOracle");
        const FeeTokenArtifact = loadArtifact("FeeToken");

        const RouterFactory = new ethers.ContractFactory(RouterArtifact.abi, RouterArtifact.bytecode, wallet);
        const router = await RouterFactory.deploy(v.teleporterAddr, wallet.address);
        await router.deployed();

        const RegistryFactory = new ethers.ContractFactory(RegistryArtifact.abi, RegistryArtifact.bytecode, wallet);
        const registry = await RegistryFactory.deploy(wallet.address);
        await registry.deployed();

        const OracleFactory = new ethers.ContractFactory(OracleArtifact.abi, OracleArtifact.bytecode, wallet);
        const oracle = await OracleFactory.deploy(wallet.address);
        await oracle.deployed();

        const AttestorFactory = new ethers.ContractFactory(AttestorArtifact.abi, AttestorArtifact.bytecode, wallet);
        const attestor = await AttestorFactory.deploy(wallet.address, oracle.address);
        await attestor.deployed();

        const FeeTokenFactory = new ethers.ContractFactory(FeeTokenArtifact.abi, FeeTokenArtifact.bytecode, wallet);
        const feeToken = await FeeTokenFactory.deploy("CredenFee", "CRED");
        await feeToken.deployed();

        const out = {
          teleporter: providedTeleporter,
          router: router.address,
          identityRegistry: registry.address,
          attestor: attestor.address,
          deployer: wallet.address,
          rpc: rpc,
          chainId: chainId,
          abis: {
            CrossChainRouter: RouterArtifact.abi,
            IdentityRegistry: RegistryArtifact.abi,
            VerificationAttestor: AttestorArtifact.abi,
            ReputationOracle: OracleArtifact.abi,
            FeeToken: FeeTokenArtifact.abi
          }
        };

        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
        console.log(`Deployed to ${k}:`, out);
      } else {
        const res = await deployToRpc(rpc, chainId, deployerKey, outPath);
        console.log(`Deployed to ${k}:`, res);
      }
    } catch (e) {
      console.error(`Failed to deploy to ${k}:`, e);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
