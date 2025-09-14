# Module 3 API - HRIS integration service

This lightweight Express API provides endpoints intended for integration with HRIS/HRMIS backends.

## API: endpoints, schemas and examples

Base path: /api (or /v1 for new versions) Auth: local dev uses HMAC-API-KEY or simple API key (set via MODULE3_API_KEY env). Do NOT send private keys.

1.  **GET** `/v1/networks`

    - Returns configured networks from `infra/endpoints.json` or `shared/onchain-artifacts/addresses.json`

    Response:

    ```json
    { "networks": [{ "key":"us", "chainId":"1337001", "rpc":"http://127.0.0.1:9650/ext/bc/C/rpc", "teleporter":"0x..." }, ...] }
    ```

    Example curl:

    ```bash
    curl http://localhost:4000/v1/networks
    ```

2.  **GET** `/v1/artifacts/addresses`

    - Returns consolidated `addresses.json` from `shared/onchain-artifacts/addresses.json`

    Response: mapping of networks -> addresses (router, teleporter, registry, attestor, feeToken)

3.  **GET** `/v1/artifacts/:network/abis`

    - Returns ABIs bundle for network (reads `shared/onchain-artifacts/abis/`)

    Response:

    ```json
    { "abis": { "CrossChainRouter": [...], "IdentityRegistry": [...], ... } }
    ```

4.  **POST** `/v1/relayer/submit`

    - Purpose: submit a signed user payload to be forwarded by the relayer (server verifies signature, enqueues job)
    - Body (JSON):

    ```json
    {
      "network": "us",
      "signedPayload": "<hex|string>",
      "signerAddress": "0x...",
      "meta": { "intent":"requestVerification","destChainId":1337002, "requestedLevel":2 }
    }
    ```

    - Response:

    ```json
    { "jobId": "uuid", "status":"queued" }
    ```

    Notes:

    - Server MUST verify signature (ethers.utils.recoverAddress / verifyMessage)
    - Server enqueues and returns jobId; worker submits sponsored tx

5.  **GET** `/v1/relayer/status/:jobId`

    - Returns job status and tx receipts (when available)

    Response:

    ```json
    { "jobId":"...", "status":"done|queued|failed", "txReceipt":{...} }
    ```

6.  **POST** `/v1/vault/upload`

    - Accepts JSON or multipart form upload (for now: JSON body with { "payload":"base64", "meta":{...} })
    - Server returns mocked CID or S3 URL

    Response:

    ```json
    { "cid":"bafy...","url":"https://mock.pinata/ipfs/bafy..." }
    ```

7.  **POST** `/v1/teleporter/send`

    - Proxy helper for teleporter flows (used in mocks)

    Body: { network:"eu", toRouter:"0x...", payload:"0x..." }

    Response: { "result":"submitted", "txHash":"0x..." }

## Example JS (frontend SDK)

```js
// fetch networks
const nets = await fetch('http://localhost:4000/v1/networks').then(r=>r.json());
// submit relayer job (signedMessage obtained from user)
await fetch('http://localhost:4000/v1/relayer/submit', {
  method:'POST', headers:{'Content-Type':'application/json','x-api-key':process.env.MODULE3_API_KEY},
  body: JSON.stringify({ network:'us', signedPayload: sig, signerAddress:addr, meta:{destChainId:1337002, requestedLevel:2} })
});
```

## Running locally (dev)

1.  cd module3-api
2.  npm install
3.  export MODULE3_API_KEY="devkey"
4.  npm run dev Service runs on http://localhost:4000 by default.
