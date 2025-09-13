import { expect } from "chai";
import { ethers } from "hardhat";

describe("OnChain Module - basic flows", function () {
  it("registers and reads identity", async function () {
    const [owner, hr] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("IdentityRegistry");
    const registry = await Registry.deploy(hr.address);
    await registry.deployed();

    await registry.connect(hr).registerIdentity(owner.address, "US", "cid:123");
    const id = await registry.getIdentity(owner.address);
    expect(id[0]).to.equal("US");
    expect(id[1]).to.equal("cid:123");
    expect(id[2]).to.equal(true);
  });

  it("creates an attestation", async function () {
    const [owner, verifier] = await ethers.getSigners();
  const Oracle = await ethers.getContractFactory("contracts/ReputationOracle.sol:ReputationOracle");
  const oracle = await Oracle.deploy(verifier.address);
    await oracle.deployed();

  const Attestor = await ethers.getContractFactory("VerificationAttestor");
  const att = await Attestor.deploy(verifier.address, oracle.address);
  await att.deployed();

  // grant UPDATER_ROLE on oracle to the attestor so attestor can call increaseReputation
  const UPDATER = await oracle.UPDATER_ROLE();
  await oracle.connect(verifier).grantRole(UPDATER, att.address);

  const tx = await att.connect(verifier).createAttestation(owner.address, ethers.utils.formatBytes32String("hash"), 2, "cid:att");
    const receipt = await tx.wait();
    const ev = receipt.events?.find((e: any) => e.event === "AttestationCreated");
    expect(ev).to.not.be.undefined;
    // oracle should have increased reputation for verifier by 1
    const rep = await oracle.getReputation(verifier.address);
    expect(rep.toNumber()).to.equal(1);
  });

  it("sends cross-chain request and receives response via TeleporterMock", async function () {
    const [deployer] = await ethers.getSigners();

    const Teleporter = await ethers.getContractFactory("TeleporterMock");
    const teleporter = await Teleporter.deploy();
    await teleporter.deployed();

    const Router = await ethers.getContractFactory("CrossChainRouter");
    const router = await Router.deploy(teleporter.address, deployer.address);
    await router.deployed();

    // Build payload for TeleporterMock delivery: target router + encoded response payload
    const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("req1"));
    const responsePayload = ethers.utils.defaultAbiCoder.encode(["bytes32", "bool", "uint8"], [requestId, true, 2]);

    const telePayload = ethers.utils.defaultAbiCoder.encode(["address", "bytes"], [router.address, responsePayload]);

    // sendMessage will attempt to deliver
    const tx = await teleporter.sendMessage(1337, telePayload);
    await tx.wait();

    // We expect VerificationResponse event when handleIncomingMessage executed
    const filter = router.filters.VerificationResponse();
    const events = await router.queryFilter(filter);
    expect(events.length).to.be.greaterThan(0);
    const ev = events[0];
    expect(ev.args?.verified).to.equal(true);
  });
});
