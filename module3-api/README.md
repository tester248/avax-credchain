# API Module

RESTful API service for enterprise integration, relayer operations, and HR verification workflows in the CredChain credential verification system.

## Overview

The API module provides:

- Enterprise integration endpoints for HRIS/HRMIS systems
- Relayer service for sponsored blockchain transactions
- Document vault integration for off-chain storage
- HR verification workflow management
- Contract artifact serving for frontend integration

## Installation

Install dependencies from the module3-api directory:

```bash
cd module3-api
npm install
```

## Configuration

Set environment variables:

```bash
export PORT=4000
export API_BASE_URL=http://localhost:4000
export MODULE3_API_KEY=devkey
```

## Running the Service

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## API Endpoints

### Network Configuration

**GET /v1/networks**
Returns configured network information

Response:
```json
{
  "networks": [
    {
      "key": "credchainus",
      "chainId": "1337001",
      "rpc": "http://127.0.0.1:35885/ext/bc/3XbrmCiJw54WYP1WKiKV4sxX1mpjmc3WJapRZ78rwCgYt2kuQ/rpc",
      "teleporter": "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf"
    }
  ]
}
```

### Contract Artifacts

**GET /v1/artifacts/addresses**
Returns deployed contract addresses by network

**GET /v1/artifacts/:network/abis**
Returns contract ABIs for specified network

### Relayer Services

**POST /v1/relayer/submit**
Submit signed verification requests for relayer processing

Request Body:
```json
{
  "messageHash": "0x...",
  "signature": "0x...",
  "meta": {
    "destChainId": 1337001,
    "attestationLevel": 1,
    "nonce": 1234567890,
    "userAddress": "0x...",
    "hrTicketId": "optional"
  }
}
```

Response:
```json
{
  "jobId": "uuid-string"
}
```

**GET /v1/relayer/status/:jobId**
Check relayer job status and transaction results

**GET /v1/relayer/list**
List all relayer jobs (development only)

**POST /v1/relayer/create-fake**
Create test relayer jobs for development

### HR Verification

**POST /api/hr/verification/request**
Request HR verification for an employee

**POST /api/hr/verification/complete/:ticketId**
Complete HR verification workflow

**GET /api/hr/verification/:ticketId**
Get HR verification status

### Document Vault

**POST /api/vault/upload**
Upload documents to off-chain storage

Request (multipart/form-data):
- `file`: Document file
- `metadata`: JSON metadata

Response:
```json
{
  "cid": "bafy...",
  "url": "https://storage.example.com/bafy..."
}
```

**GET /api/vault/:cid**
Retrieve document by CID

### Contract Integration

**GET /api/contracts/addresses**
Get deployed contract addresses

**POST /api/teleporter/send**
Send cross-chain messages via Teleporter

## Authentication

The API supports API key authentication for development:

```bash
curl -H "X-API-Key: devkey" http://localhost:4000/v1/relayer/submit
```

## Data Storage

The API uses file-based storage for development:

- **Jobs**: `data/jobs.json`
- **HR Requests**: `data/hr-requests.json`
- **Uploaded Files**: `uploads/` directory

## Integration Examples

### Frontend Integration

```javascript
// Submit verification request
const response = await fetch('http://localhost:4000/v1/relayer/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messageHash: signedMessage.messageHash,
    signature: signedMessage.signature,
    meta: {
      destChainId: 1337001,
      attestationLevel: 1,
      nonce: Date.now(),
      userAddress: userAddress
    }
  })
});

const { jobId } = await response.json();
```

### HRIS Integration

```javascript
// Request employee verification
const verificationRequest = await fetch('http://localhost:4000/api/hr/verification/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    requestedLevel: 2
  })
});
```

## Error Handling

The API returns standard HTTP status codes:

- **200**: Success
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (invalid API key)
- **404**: Not Found (resource not found)
- **500**: Internal Server Error

Error responses include descriptive messages:

```json
{
  "error": "Invalid signature provided"
}
```

## Security Considerations

- Never accept private keys from clients
- Validate all input parameters and signatures
- Implement rate limiting for production deployments
- Use HTTPS in production environments
- Rotate API keys regularly

## Development Features

The API includes several development-only features:

- Mock relayer operations
- Test data generation
- Detailed logging and debugging
- File-based storage (replace with database in production)

## Production Deployment

For production deployment:

1. Replace file-based storage with proper database
2. Implement proper authentication and authorization
3. Add rate limiting and request validation
4. Configure HTTPS and security headers
5. Set up monitoring and logging
6. Implement backup and recovery procedures

## Troubleshooting

**Service Won't Start**:
- Check port availability
- Verify environment variables
- Ensure all dependencies are installed

**Relayer Issues**:
- Verify blockchain connectivity
- Check account balances and gas settings
- Validate signature formats

**Integration Issues**:
- Verify API endpoints and request formats
- Check CORS configuration for browser requests
- Validate contract addresses and network configuration
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
