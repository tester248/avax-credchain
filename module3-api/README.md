Module 3 API - HRIS integration service

This lightweight Express API provides endpoints intended for integration with HRIS/HRMIS backends.

Key endpoints:
- POST /api/vault/upload -> accepts file or JSON payload, returns a CID/URL (mocked Pinata or S3)
- POST /api/teleporter/send -> proxy to teleporter flow or mock
- GET /api/contracts/abis -> serves ABIs and addresses from shared artifacts
- POST /api/register -> register identity (accepts user metadata, returns tx placeholder)
- POST /api/attest -> create attestation (mock)
- POST /api/crosschain/request -> request cross-chain verification (mock)
- GET /health -> basic health check

Environment variables are read from the repo `env.sh` or your CI secrets. See `../env.sh` for examples.

To run (development):

1. cd module3-api
2. npm install
3. npm run dev
