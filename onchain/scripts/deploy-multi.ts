import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { resolve } from "path";

async function deployToRpc(rpcUrl: string, chainId: number | undefined, deployerKey: string, outPath: string) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(deployerKey, provider);

  // Check which contracts actually exist
  const loadArtifact = (name: string) => {
    const jsonPath = path.join(process.cwd(), "onchain","artifacts", "contracts", `${name}.sol`, `${name}.json`);
    if (!fs.existsSync(jsonPath)) {
      console.warn(`Artifact not found: ${jsonPath} - skipping ${name}`);
      return null;
    }
    return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  };

  const TeleporterArtifact = loadArtifact("TeleporterMock");
  const RouterArtifact = loadArtifact("CrossChainRouter");
  const RegistryArtifact = loadArtifact("IdentityRegistry");
  const AttestorArtifact = loadArtifact("VerificationAttestor");

  // Optional contracts - only deploy if they exist
  const OracleArtifact = loadArtifact("ReputationOracle");
  const FeeTokenArtifact = loadArtifact("FeeToken");

  // Deploy teleporter mock by default; caller may request no mock
  let teleporterAddress: string | null = null;
  if (TeleporterArtifact) {
    const TeleporterFactory = new ethers.ContractFactory(TeleporterArtifact.abi, TeleporterArtifact.bytecode, wallet);
    const teleporter = await TeleporterFactory.deploy();
    await teleporter.deployed();
    teleporterAddress = teleporter.address;
    console.log(`Deployed TeleporterMock at ${teleporterAddress}`);
  }

  // Deploy router if available
  let routerAddress: string | null = null;
  if (RouterArtifact && teleporterAddress) {
    const RouterFactory = new ethers.ContractFactory(RouterArtifact.abi, RouterArtifact.bytecode, wallet);
    const router = await RouterFactory.deploy(teleporterAddress, wallet.address);
    await router.deployed();
    routerAddress = router.address;
    console.log(`Deployed CrossChainRouter at ${routerAddress}`);
  }

  // Deploy registry if available
  let registryAddress: string | null = null;
  if (RegistryArtifact) {
    const RegistryFactory = new ethers.ContractFactory(RegistryArtifact.abi, RegistryArtifact.bytecode, wallet);
    const registry = await RegistryFactory.deploy(wallet.address);
    await registry.deployed();
    registryAddress = registry.address;
    console.log(`Deployed IdentityRegistry at ${registryAddress}`);
  }

  // Deploy oracle if available
  let oracleAddress: string | null = null;
  if (OracleArtifact) {
    const OracleFactory = new ethers.ContractFactory(OracleArtifact.abi, OracleArtifact.bytecode, wallet);
    const oracle = await OracleFactory.deploy(wallet.address);
    await oracle.deployed();
    oracleAddress = oracle.address;
    console.log(`Deployed ReputationOracle at ${oracleAddress}`);
  }

  // Deploy attestor if available
  let attestorAddress: string | null = null;
  if (AttestorArtifact) {
    const AttestorFactory = new ethers.ContractFactory(AttestorArtifact.abi, AttestorArtifact.bytecode, wallet);
    // Use oracle address if available, otherwise use deployer address as placeholder
    const attestor = await AttestorFactory.deploy(wallet.address, oracleAddress || wallet.address);
    await attestor.deployed();
    attestorAddress = attestor.address;
    console.log(`Deployed VerificationAttestor at ${attestorAddress}`);
  }

  // Deploy fee token if available
  let feeTokenAddress: string | null = null;
  if (FeeTokenArtifact) {
    const FeeTokenFactory = new ethers.ContractFactory(FeeTokenArtifact.abi, FeeTokenArtifact.bytecode, wallet);
    const feeToken = await FeeTokenFactory.deploy("CredenFee", "CRED");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;
    console.log(`Deployed FeeToken at ${feeTokenAddress}`);
  }

  const out = {
    teleporter: teleporterAddress,
    router: routerAddress,
    identityRegistry: registryAddress,
    attestor: attestorAddress,
    oracle: oracleAddress,
    feeToken: feeTokenAddress,
    deployer: wallet.address,
    rpc: rpcUrl,
    chainId: chainId,
    abis: {
      ...(TeleporterArtifact && { TeleporterMock: TeleporterArtifact.abi }),
      ...(RouterArtifact && { CrossChainRouter: RouterArtifact.abi }),
      ...(RegistryArtifact && { IdentityRegistry: RegistryArtifact.abi }),
      ...(AttestorArtifact && { VerificationAttestor: AttestorArtifact.abi }),
      ...(OracleArtifact && { ReputationOracle: OracleArtifact.abi }),
      ...(FeeTokenArtifact && { FeeToken: FeeTokenArtifact.abi })
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
  
  // Try to read infra/teleporter.json to merge teleporter addresses
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
      // If endpoints entry has teleporterAddr or infra/teleporter.json has it, use that
      const providedTeleporter = v.teleporterAddr || teleporterMap[k];
      if (providedTeleporter) {
        console.log(`Using existing teleporter at ${providedTeleporter} for ${k}`);
        // Deploy contracts but use existing teleporter address
        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const wallet = new ethers.Wallet(deployerKey, provider);

        const loadArtifact = (name: string) => {
          const jsonPath = path.join(process.cwd(), "onchain", "artifacts", "contracts", `${name}.sol`, `${name}.json`);
          if (!fs.existsSync(jsonPath)) {
            console.warn(`Artifact not found: ${jsonPath} - skipping ${name}`);
            return null;
          }
          return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
        };

        const RouterArtifact = loadArtifact("CrossChainRouter");
        const RegistryArtifact = loadArtifact("IdentityRegistry");
        const AttestorArtifact = loadArtifact("VerificationAttestor");
        const OracleArtifact = loadArtifact("ReputationOracle");
        const FeeTokenArtifact = loadArtifact("FeeToken");

        let routerAddress = null;
        if (RouterArtifact) {
          const RouterFactory = new ethers.ContractFactory(RouterArtifact.abi, RouterArtifact.bytecode, wallet);
          const router = await RouterFactory.deploy(providedTeleporter, wallet.address);
          await router.deployed();
          routerAddress = router.address;
        }

        let registryAddress = null;
        if (RegistryArtifact) {
          const RegistryFactory = new ethers.ContractFactory(RegistryArtifact.abi, RegistryArtifact.bytecode, wallet);
          const registry = await RegistryFactory.deploy(wallet.address);
          await registry.deployed();
          registryAddress = registry.address;
        }

        let oracleAddress = null;
        if (OracleArtifact) {
          const OracleFactory = new ethers.ContractFactory(OracleArtifact.abi, OracleArtifact.bytecode, wallet);
          const oracle = await OracleFactory.deploy(wallet.address);
          await oracle.deployed();
          oracleAddress = oracle.address;
        }

        let attestorAddress = null;
        if (AttestorArtifact) {
          const AttestorFactory = new ethers.ContractFactory(AttestorArtifact.abi, AttestorArtifact.bytecode, wallet);
          const attestor = await AttestorFactory.deploy(wallet.address, oracleAddress || wallet.address);
          await attestor.deployed();
          attestorAddress = attestor.address;
        }

        let feeTokenAddress = null;
        if (FeeTokenArtifact) {
          const FeeTokenFactory = new ethers.ContractFactory(FeeTokenArtifact.abi, FeeTokenArtifact.bytecode, wallet);
          const feeToken = await FeeTokenFactory.deploy("CredenFee", "CRED");
          await feeToken.deployed();
          feeTokenAddress = feeToken.address;
        }

        const out = {
          teleporter: providedTeleporter,
          router: routerAddress,
          identityRegistry: registryAddress,
          attestor: attestorAddress,
          oracle: oracleAddress,
          feeToken: feeTokenAddress,
          deployer: wallet.address,
          rpc: rpc,
          chainId: chainId,
          abis: {
            ...(RouterArtifact && { CrossChainRouter: RouterArtifact.abi }),
            ...(RegistryArtifact && { IdentityRegistry: RegistryArtifact.abi }),
            ...(AttestorArtifact && { VerificationAttestor: AttestorArtifact.abi }),
            ...(OracleArtifact && { ReputationOracle: OracleArtifact.abi }),
            ...(FeeTokenArtifact && { FeeToken: FeeTokenArtifact.abi })
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
