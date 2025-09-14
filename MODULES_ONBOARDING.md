# CredentialChain — Modules & Onboarding

Purpose: provide comprehensive, actionable context for three parallel modules so three teammates (and their Copilot agents) can begin work independently and integrate smoothly. This doc emphasizes Avalanche features from https://build.avax.network/docs and prescribes artifacts, APIs, and acceptance criteria.

---

## Quick prerequisites

- Node.js 18+ and npm/yarn
- Hardhat (for smart contract dev)
- Next.js 13+ (App Router recommended)
- Docker (for local subnet node containers if needed)
- Core Wallet (for demo) or MetaMask configured with local subnet RPCs
- Avalanche CLI & SDKs: `@avalabs/avalanche-cli`, `@avalabs/avalanche-sdk`, `@avalabs/subnet-evm`, `@avalabs/icm-contracts`
- Recommended tools: TypeScript, ESLint, Prettier, Git

Environment vars (examples)
- AVALANCHE_CLI_API_KEY (if using AvaCloud)
- AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (vault)
- PINATA_API_KEY, PINATA_API_SECRET (IPFS pinning)
- TELEPORTER_MESSENGER_ADDR_US, TELEPORTER_MESSENGER_ADDR_EU (filled by Module 1)
- SUBNET_US_RPC, SUBNET_EU_RPC (filled by Module 1)

---

# Project overview (very short)
CredentialChain is an enterprise-grade identity & credential verification PoC built on Avalanche subnets. Key Avalanche features used:
- Subnets (subnet-evm) for jurisdictional isolation and customized genesis
- Interchain Messaging (ICM / Teleporter) for cross-subnet queries/responses
- Encrypted EVM Runtime Compiler (EERC) or client-side encryption for PII
- AvaCloud / avalanche-cli / HyperSDK for deployment & node management
- High throughput & sub-second finality demonstrated via local subnets

This repo is split into three integration-friendly modules handled by three teammates.

---

# Regulatory considerations (India)

Not legal advice — consult an Indian lawyer or compliance expert before any public deployment or demo that could be considered a crypto service.

Key points
- Any on-chain write (a smart contract call that mutates state) is technically a blockchain transaction and requires gas. From a technical and regulatory viewpoint this is a "crypto transaction."  
- You can reduce end-user exposure to crypto (and regulatory surface area) by using enterprise-managed relayers (sponsored or meta-transactions) or by running a permissioned subnet under your control. These approaches do not eliminate on-chain activity, but they shift custody and payment of gas to the enterprise.
- Avoid token issuance, marketplaces, or direct crypto payments until you have legal sign-off — those activities have higher regulatory risk.

Recommended design pattern for India: Permissioned subnet + sponsored transactions

What it is (simple)
- A private/permissioned Avalanche subnet where only approved validators run the chain and enterprise controls validator access and governance.  
- The enterprise runs a relayer (central wallet) that pays gas for users' transactions (sponsored or meta-transactions), so end users do not need to hold or transfer crypto.

How it works (high level)
1. Enterprise deploys a permissioned subnet (AvaCloud or private subnet) and restricts validators to approved operators.
2. Users interact with your app and submit signed requests (HTTP + signed payload) to your backend API.
3. The backend/relayer verifies signatures and submits the equivalent on-chain transaction to the permissioned subnet, paying gas from a central enterprise wallet.
4. Optionally, the backend anchors periodic Merkle roots or audit checkpoints to an enterprise-controlled chain for tamper-evidence.

What users see
- A normal web app experience: no wallet setup, no token balances, and no direct crypto handling. The chain provides an immutable audit trail but is effectively an enterprise ledger.

Pros & cons
- Pros: full enterprise control, low user friction for demos, better alignment with a compliance-first approach, and minimized public crypto exposure for end users.
- Cons: operational costs for nodes/validators, you must securely manage validator and relayer keys, and you still need legal sign-off since on-chain activity occurs (even if enterprise-sponsored).

Good for
- Enterprise demos or internal deployments that require on-chain immutability and audit trails while minimizing end-user crypto exposure.

Immediate actionable steps for this repo
- Pause any token issuance or crypto-payment features until legal sign-off.  
- Default to permissioned subnet templates in `infra/subnets/` and document `PERMISSIONED=true` or similar flags in `infra/README.md`.
- Add relayer configuration to infra quick-prereqs and env examples: `RELAYER_PRIVATE_KEY`, `RELAYER_ADDRESS`, `PERMISSIONED_SUBNET=true`. Do NOT commit private keys; use `infra/README_KEYS.md` to explain secure injection via secrets manager or CI.
- Implement a relayer/meta-transaction skeleton in `infra/scripts/relayer.ts` (I can add this) that verifies signed user requests and submits sponsored transactions to the permissioned subnet.
- Engage Indian legal counsel before public demos or production deployments.

If you want, I can scaffold the relayer skeleton, wire the permissioned-subnet flags into the deploy scripts, and add example env configuration and documentation.


# Module 1: Infra & Subnet Orchestration ("Infra")

Primary responsibilities
- Create reproducible subnet templates (US, EU) using `@avalabs/subnet-evm` and `avalanche-cli`.
- Manage local deployment scripts and AvaCloud deployment templates for demo.
- Configure genesis policies and metadata to reflect jurisdictional constraints (validator geofencing metadata, consent flags in genesis config).
- Deploy Teleporter/ICM infrastructure: obtain Teleporter messenger contract addresses (or deploy mock Teleporter for local dev) and register message routes.
- Provide secure validator keys and RPC endpoints for each subnet and publish them to a shared JSON artifact.
- Document EERC enablement steps and provide a stubbed integration if full EERC setup is deferred.

Tech stack
- Node.js + TypeScript
- @avalabs/avalanche-cli, @avalabs/avalanche-sdk, @avalabs/subnet-evm
- Docker (optional) for node containers
- Bash / PowerShell deployment scripts
- Optional: Terraform templates or AvaCloud templates

Deliverables (artifacts)
- c:\Users\Ashwin\Documents\Avalanche\project\infra\subnets\ (templates + genesis)
- c:\Users\Ashwin\Documents\Avalanche\project\infra\deploy-scripts\deploy-subnets.ts (or .sh)
- c:\Users\Ashwin\Documents\Avalanche\project\infra\endpoints.json (example, updated post-deploy)
  - { us: { id, rpc }, eu: { id, rpc } }
- Teleporter messenger contract addresses in infra/teleporter.json
- README: instructions to run local subnets + add RPCs to Core Wallet

Tasks (ordered)
1. Create subnet templates for US & EU, set chain IDs and native token names. (2-4h)
2. Implement a deploy script (TS) to create+deploy locally with avalanche-cli and output endpoints.json. (2-3h)
3. Deploy a Teleporter mock contract for local Teleporter flows and add its address to teleporter.json. (1-2h)
4. Document how to enable EERC for US subnet (link to build docs) and provide a local encryption stub if needed. (1h)
5. Provide instructions for Core Wallet RPC entries and sample accounts for demo. (30m)

APIs & integration points (what Module 2 & 3 expect)
- endpoints.json with fields: { us: { chainId, subnetId, rpc, teleporterAddr }, eu: { ... } }
- genesis and validator keypair artifacts (secure-sharing instructions) — private keys should never be commited; provide sample dev keys.
- Teleporter messenger address to use in CrossChain contract constructor.

Acceptance criteria
- `npm run infra:start-local` spins up both subnets and returns usable RPC endpoints.
- Teleporter mock is deployed and reachable by contracts on both subnets.
- endpoints.json is committed (with placeholder values) and updated after deploy.

---

# Module 2: Smart Contracts & Cross-Chain Logic ("OnChain")

Primary responsibilities
- Implement the core Solidity contracts and on-chain logic: IdentityRegistry, VerificationAttestor, CrossChainRouter (Teleporter integration), ReputationOracle, optional fee token.
- Integrate ICM via `@avalabs/icm-contracts` Teleporter interfaces and emit/consume cross-chain messages.
- Provide hardhat scripts for compilation, unit tests, and per-subnet deployment.
- Produce ABIs and TypeChain artifacts for frontend & infra consumption.
- Define events and message payloads for the frontend and backend to subscribe to.

Tech stack
- Hardhat + TypeScript
- Solidity ^0.8.x, OpenZeppelin contracts
- @avalabs/icm-contracts for Teleporter interface
- ethers.js for testing & scripts
- TypeChain for typed ABIs

Contracts & interface summary
- IdentityRegistry.sol
  - Roles: DEFAULT_ADMIN_ROLE, HR_ROLE
  - Functions: registerIdentity(...), updateConsent(...), requestDeletion(...), getIdentity(...)
  - Stores hashes/pointers, consent flags, jurisdiction
  - Emits: IdentityRegistered(user, jurisdiction, ipfsCid?), IdentityUpdated(user)

- VerificationAttestor.sol
  - Roles: VERIFIER_ROLE
  - Functions: createAttestation(user, attHash, level, metadataCID)
  - Emits: AttestationCreated(attestationId, user, level, verifier)

- CrossChainRouter.sol
  - Integrates Teleporter messenger address (constructor param)
  - requestVerification(destChainId, user, attestationLevel) -> sends Teleporter message
  - handleIncomingMessage -> decodes Teleporter message and emits VerificationResponse(requestId, verified, level)

- ReputationOracle.sol (optional v1)
  - Aggregates verifier reputations, updates via attestation events

Important integration notes
- All PII must not be stored in plain text on-chain; contracts accept hashes and IPFS CIDs only.
- CrossChain payloads must be size-limited and may carry only minimal identifiers and hashes; full document exchange uses off-chain vault + pointer exchange.

Tasks (ordered)
1. Scaffold contracts with clear interface types and events. (2-4h)
2. Write unit tests for registry & attestor flows (Hardhat Mocha). (3-4h)
3. Implement Teleporter send/receive flows using icm-contracts interface. Provide a mock Teleporter for local dev. (3-5h)
4. Create deployment scripts that read infra/endpoints.json to deploy per subnet and write deployment artifacts to onchain/artifacts/{us,eu}.json. (2-3h)
5. Export ABIs and TypeChain types to a shared location for frontend consumption. (30m)

Artifacts produced
- contracts/ (solidity sources)
- scripts/deploy.ts (per subnet deployer)
- tests/ (unit & integration tests)
- onchain/artifacts/{us,eu}/ (addresses.json + ABIs)
- onchain/README.md (how to run tests & deploy locally)

Events & payloads (explicit)
- IdentityRegistered(address indexed user, string jurisdiction, string ipfsCid)
- AttestationCreated(bytes32 indexed id, address indexed user, uint8 level, address verifier)
- VerificationRequested(bytes32 requestId, address user, bytes32 targetChain)
- VerificationResponse(bytes32 requestId, bool verified, uint8 level)

Acceptance criteria
- All core contracts compile and pass unit tests (>= 90% coverage for key flows).
- Deployment script deploys contracts to local subnets (addresses appear in onchain/artifacts).
- CrossChainRouter tests demonstrate a request on EU that triggers a response from US via mock Teleporter.

---

# Module 3: Frontend, Off-Chain Vault & Orchestration ("App")

Primary responsibilities
- Next.js 13+ application (App Router) implementing wallet login, registration UI, verification flows, cross-chain request UI, and audit timeline.
- API routes for server-side operations: vault uploads (S3/IPFS), encryption key management (envelope encryption), Teleporter orchestration for server-signed cross-chain operations, and a webhook endpoint for Teleporter events if needed.
- A background worker / cron job to poll expiries and trigger re-attestation flows via backend APIs.
- Demo-friendly mock mode to simulate Teleporter and attestor responses when real infra is unavailable.

Tech stack
- Next.js (App Router), TypeScript
- TailwindCSS for UI
- wagmi / viem + ethers for wallet interactions (Core Wallet support)
- Axios / fetch for API calls
- IPFS client (pinata-sdk) or S3 client for document storage
- Node worker (bullmq or simple setInterval) for re-attestation jobs

Pages & API routes (minimal)
- /app/dashboard – list identities & statuses (server component + client components)
- /app/register – registration form (client component, uses wallet signing)
- /app/attest – request attestation / view attestation timeline
- /api/vault/upload – accepts encrypted payload -> pins to IPFS or S3 -> returns CID/URL
- /api/teleporter/send – server proxy to call Teleporter SDK if required (uses infra endpoints)
- /api/contracts/abis – serves ABIs and addresses from onchain/artifacts

Tasks (ordered)
1. Scaffold Next.js app and base layout, add Tailwind. (1-2h)
2. Implement wallet connect utility and network switch for local subnets. (1-2h)
3. Create RegisterForm and Dashboard components (use mock data until contracts are deployed). (2-3h)
4. Implement vault upload endpoint and client encryption utilities (AES envelope encryption). (2-4h)
5. Integrate contract ABIs and addresses (consume onchain/artifacts) and implement simple attestation flows calling deployed contracts. (2-4h)
6. Implement cross-chain request UI that calls CrossChainRouter.requestVerification and listens for VerificationResponse events. (2-3h)
7. Add mock mode & fallback demo script in case Teleporter or subnets are down. (1-2h)

Artifacts produced
- app/ (Next.js application)
- app/api/ (server routes for vault & teleporter proxy)
- app/components/ (RegisterForm, Dashboard, AttestationRow, NetworkSwitcher)
- app/lib/ (web3 utils, encryption helpers)

Acceptance criteria
- User can register an identity and see the hashed pointer stored on-chain (or simulated in mock).
- Verifier can create an attestation via the UI, and the attestation appears in the audit timeline.
- Cross-chain request button triggers Teleporter message in live or mock mode and a response updates UI.

---

# Integration & Communication Between Modules (explicit contract)

Key artifacts exchanged
- infra/endpoints.json (Module 1 -> others)
- onchain/artifacts/{us,eu}/addresses.json & ABIs (Module 2 -> Module 3)
- vault upload URL / CID (Module 3 -> Module 2 via Transaction metadata)

Environment variables each module expects
- Module 1 (Infra): writes endpoints.json
- Module 2 (OnChain): reads endpoints.json, writes onchain/artifacts
- Module 3 (App): reads onchain/artifacts and endpoints.json

API conventions
- Use JSON over HTTPS for local API routes. Example API response formats should be in ./specs/api-schema.json (Module 2 or 3 can author).
- Event-driven flows: frontend subscribes to contract events (websocket or Alchemy-like provider) and backend worker may optionally listen to the same events.

Messaging & Teleporter contract usage
- Module 2 will emit VerificationRequested(requestId, ...) and call Teleporter.sendCrossChainMessage with a compact payload: { requestId, userAddr, requesterSubnetId }
- Receiving subnet decodes, resolves local attestations, and uses teleporter to send back a VerificationResponse payload.
- Module 3 displays these events and maps requestId -> friendly UI state.

---

# Team assignments & recommended task splits (3 people)

Team size: 3. Suggested mapping:

- Teammate A (Infra Owner)
  - Module 1 lead
  - Primary tasks: subnet templates, deploy scripts, Teleporter mock deployment, endpoints.json, README infra runbook
  - Priority: ensure RPC endpoints and teleporter addresses are available by end of Day 1

- Teammate B (OnChain Owner)
  - Module 2 lead
  - Primary tasks: implement contracts, unit tests, Teleporter integration, deployment scripts, ABIs/typechain
  - Priority: provide stable ABIs and onchain/artifacts to Module 3 by midday Day 2

- Teammate C (App Owner)
  - Module 3 lead
  - Primary tasks: Next.js scaffold, wallet connect, RegisterForm, vault upload endpoint, attestation UI, mock/demo page
  - Priority: have basic UI with mock flows before contracts are live; integrate ABIs once available

Cross-team expectations
- Daily sync points every 4 hours in the hackathon (short): infra status, deployed addresses, broken integration blockers.
- Use shared artifact folder: c:\Users\Ashwin\Documents\Avalanche\project\shared\ with onchain/artifacts/ and infra/endpoints.json
- Each module creates a minimal README and a `ready.md` with checklist of completed items.

---

# Development process & conventions

- Branch naming: `module/{infra|onchain|app}/{short-desc}`
- Commit messages: `module: small description (#task)`
- PRs: include demo screenshot or small gif and which acceptance criteria are satisfied
- Code style: TypeScript with ESLint + Prettier; Hardhat tests with Mocha
- Secrets: never commit any private keys. Provide sample dev key templates in `infra/sample-keys/`.

---

# Local dev quickstart (condensed)

1. Clone repo to `c:\Users\Ashwin\Documents\Avalanche\project`
2. Install root dependencies (if monorepo): `npm install` or use per-module installs
3. Module 1: `npm run infra:start-local` -> verify `infra/endpoints.json` exists
4. Module 2: `cd onchain && npm install && npx hardhat test` (should pass unit tests)
5. Module 2 deploy: `node scripts/deploy.js --endpoints ../infra/endpoints.json` -> writes onchain/artifacts
6. Module 3: `cd app && npm install && npm run dev` -> open http://localhost:3000 and connect wallet to subnet RPCs

---

# Demo checklist (hackathon)

Must-haves
- Two local subnets running and RPC entries added to Core Wallet
- Identity registry + attestor deployed to both subnets
- Next.js dashboard showing a registered identity and attestation
- Cross-subnet request demo (real or mock) with visible verification response
- Audit timeline showing at least 3 events for a sample user

Nice-to-have
- EERC demo (even if simulated) showing encrypted PII stored securely
- Reputation scoring basic implementation
- Recorded fallback video for Teleporter if live call fails

---

# Acceptance criteria & metrics

- End-to-end attestation flow (register -> attestor -> cross-chain verification) works in under 10s in demo environment
- Off-chain payloads are encrypted and only pointers (CIDs) are on-chain
- Contracts are unit-tested and deployable with provided scripts
- UI demonstrates auditability and consent flags clearly

---

# References

- Avalanche Build Docs: https://build.avax.network/docs
- Subnet EVM: https://github.com/ava-labs/subnet-evm
- ICM / Teleporter contracts: refer to `@avalabs/icm-contracts`
- EERC & Encrypted EVM: see build docs section on EERC

---

Placeholders & follow-ups
- After Module 1 completes its deploy, replace placeholders in `infra/endpoints.json` and notify the team. Module 2 and 3 should consume those artifacts.
- Module owners should create `ready.md` files indicating which acceptance criteria were met and any remaining risks.

## Module 3 API contract (minimal schemas for frontend/SDK)

1) GET /v1/networks
Response:
{
  "networks": [
    { "key":"us", "chainId":"1337001", "rpc":"http://127.0.0.1:9650/ext/bc/C/rpc", "teleporter":"0x..." },
    ...
  ]
}

2) GET /v1/artifacts/addresses
Response:
{
  "us": {
    "teleporter":"0x...", "router":"0x...", "identityRegistry":"0x...", "attestor":"0x...", "oracle":"0x...", "feeToken":"0x...", "rpc":"http://...","chainId":"1337001"
  },
  "eu": { ... }
}

3) GET /v1/artifacts/:network/abis
Response:
{ "abis": { "CrossChainRouter": [...], "IdentityRegistry":[...], ... } }

4) POST /v1/relayer/submit
Request:
{
  "network":"us",
  "signedPayload":"0x...",    // user-signed bytes or EIP-712 signature
  "signerAddress":"0x...",
  "meta": { "intent":"requestVerification", "destChainId":1337002, "requestedLevel":2 }
}
Response:
{ "jobId":"uuid", "status":"queued" }

5) POST /v1/vault/upload
Request:
{ "payload":"base64", "meta":{...} }
Response:
{ "cid":"bafy...", "url":"https://..." }

Frontend implementers: use these shapes to mock and integrate. Module3 API will serve ABI and address files from shared/onchain-artifacts.


End of onboarding file.

# New: India subnet (IN) & Aadhaar considerations

We added a third jurisdictional subnet: `credchainin` (Chain ID 1337003). Integration notes:
- Infra provides `infra/endpoints.json` with `in` entry and RPC `http://127.0.0.1:9654/ext/bc/C/rpc`.
- For Aadhaar-related document handling DO NOT store raw Aadhaar numbers on-chain.
- Recommended flow: integrate anon-aadhaar (https://github.com/anon-aadhaar/anon-aadhaar) inside the Module 3 vault pipeline to anonymize or tokenize identifiers before pinning to IPFS or S3 and storing the pointer on-chain.
- Legal review is mandatory: Aadhaar data is highly regulated under Indian law; consult counsel before any real-data testing.

---
