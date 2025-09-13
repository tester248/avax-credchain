import fs from "fs";
import path from "path";
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with", deployer.address);

  // Deploy TeleporterMock
  const Teleporter = await ethers.getContractFactory("TeleporterMock");
  const teleporter = await Teleporter.deploy();
  await teleporter.deployed();
  console.log("TeleporterMock deployed to:", teleporter.address);

  // Deploy CrossChainRouter with teleporter address
  const Router = await ethers.getContractFactory("CrossChainRouter");
  const router = await Router.deploy(teleporter.address, deployer.address);
  await router.deployed();
  console.log("CrossChainRouter deployed to:", router.address);

  // Deploy IdentityRegistry
  const Registry = await ethers.getContractFactory("IdentityRegistry");
  const registry = await Registry.deploy(deployer.address);
  await registry.deployed();
  console.log("IdentityRegistry deployed to:", registry.address);

  // deploy reputation oracle first
  const OracleFactory = await ethers.getContractFactory("ReputationOracle");
  const oracle = await OracleFactory.deploy(deployer.address);
  await oracle.deployed();

  const AttestorFactory = await ethers.getContractFactory("VerificationAttestor");
  const attestor = await AttestorFactory.deploy(deployer.address, oracle.address);
  await attestor.deployed();
  await attestor.deployed();
  console.log("VerificationAttestor deployed to:", attestor.address);

  // Deploy FeeToken (optional)
  const FeeTokenFactory = await ethers.getContractFactory("FeeToken");
  const feeToken = await FeeTokenFactory.deploy("CredenFee", "CRED");
  await feeToken.deployed();
  console.log("FeeToken deployed to:", feeToken.address);

  // Prepare artifact directory
  const artifactsDir = path.join(__dirname, "..", "artifacts");
  try { fs.mkdirSync(artifactsDir, { recursive: true }); } catch (e) {}

  // Try to read infra/endpoints.json from repo root
  const infraPath = path.join(__dirname, "..", "..", "infra", "endpoints.json");
  let endpoints: any = null;
  try {
    const raw = fs.readFileSync(infraPath, "utf8");
    endpoints = JSON.parse(raw);
    console.log("Found infra endpoints.json");
  } catch (e) {
    console.log("No infra/endpoints.json found; writing local artifacts only.");
  }

  // include ABIs to ease integration with App module
  const TeleporterArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "artifacts", "contracts", "TeleporterMock.sol", "TeleporterMock.json"), "utf8"));
  const RouterArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "artifacts", "contracts", "CrossChainRouter.sol", "CrossChainRouter.json"), "utf8"));
  const RegistryArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "artifacts", "contracts", "IdentityRegistry.sol", "IdentityRegistry.json"), "utf8"));
  const AttestorArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "artifacts", "contracts", "VerificationAttestor.sol", "VerificationAttestor.json"), "utf8"));
  const OracleArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "artifacts", "contracts", "ReputationOracle.sol", "ReputationOracle.json"), "utf8"));
  const FeeTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "artifacts", "contracts", "FeeToken.sol", "FeeToken.json"), "utf8"));

  const data = {
    teleporter: teleporter.address,
    router: router.address,
    identityRegistry: registry.address,
    attestor: attestor.address,
    deployer: deployer.address,
    abis: {
      TeleporterMock: TeleporterArtifact.abi,
      CrossChainRouter: RouterArtifact.abi,
      IdentityRegistry: RegistryArtifact.abi,
        VerificationAttestor: AttestorArtifact.abi,
        ReputationOracle: OracleArtifact.abi,
        FeeToken: FeeTokenArtifact.abi
    },
    endpoints: endpoints
  };

  // If endpoints has networks, write per-network files, otherwise write local.json
  if (endpoints && typeof endpoints === 'object') {
    for (const [k, v] of Object.entries(endpoints)) {
      const outPath = path.join(artifactsDir, `${k}.json`);
      const out = Object.assign({ network: k }, data, { endpoints: { [k]: v } });
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
      console.log("Wrote artifacts for", k, outPath);
    }
  } else {
    const outPath = path.join(artifactsDir, "local.json");
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log("Wrote artifacts to", outPath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
