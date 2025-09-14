import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// In-memory demo users store
const demoUsers: Array<any> = [
  { address: '0x0000000000000000000000000000000000000001', name: 'Alice', attestationLevel: 2 },
  { address: '0x0000000000000000000000000000000000000002', name: 'Bob', attestationLevel: 1 },
  { address: '0x0000000000000000000000000000000000000003', name: 'Carol', attestationLevel: 0 }
];

// HR verification requests store
interface HRVerificationRequest {
  ticketId: string;
  hrRequestId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  verificationTypes: string[];
  status: 'pending' | 'sent_to_employee' | 'employee_signed' | 'verified' | 'failed';
  createdAt: string;
  updatedAt: string;
  verificationUrl?: string;
  signedPayload?: string;
  signature?: string;
  verifiedAddress?: string;
}

const HR_REQUESTS_FILE = path.join(__dirname, '../../data/hr-requests.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(HR_REQUESTS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load HR requests from file
async function loadHRRequests(): Promise<HRVerificationRequest[]> {
  try {
    const data = await fs.readFile(HR_REQUESTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save HR requests to file
async function saveHRRequests(requests: HRVerificationRequest[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(HR_REQUESTS_FILE, JSON.stringify(requests, null, 2));
}

// GET /api/hr/users - list demo users
router.get('/users', (_req: Request, res: Response) => {
  return res.json({ users: demoUsers });
});

// POST /api/hr/seed - reset/seed demo users (optional)
router.post('/seed', (_req: Request, res: Response) => {
  // For demo we simply return the existing seed; a full implementation could accept a body
  return res.json({ users: demoUsers });
});

// POST /api/hr/register
// Accepts: { userAddress, jurisdiction, ipfsCid }
router.post('/register', (req: Request, res: Response) => {
  const { userAddress, jurisdiction, ipfsCid } = req.body || {};
  if (!userAddress || !ipfsCid) {
    return res.status(400).json({ error: 'userAddress and ipfsCid required' });
  }

  // In a full implementation this would submit a transaction via a relayer
  const tx = { txHash: `0xreg${Date.now()}`, status: 'submitted' };
  return res.json({ tx, userAddress, jurisdiction, ipfsCid });
});

// POST /api/hr/attest
// Accepts: { userAddress, level, metadataCid }
router.post('/attest', (req: Request, res: Response) => {
  const { userAddress, level, metadataCid } = req.body || {};
  if (!userAddress || !level) {
    return res.status(400).json({ error: 'userAddress and level required' });
  }
  const attestation = { id: `att_${Date.now()}`, userAddress, level, metadataCid };
  return res.json({ attestation, status: 'created' });
});

// POST /api/hr/crosschain/request
// Accepts: { destChainId, userAddress, requestedLevel }
router.post('/crosschain/request', (req: Request, res: Response) => {
  const { destChainId, userAddress, requestedLevel } = req.body || {};
  if (!destChainId || !userAddress) {
    return res.status(400).json({ error: 'destChainId and userAddress required' });
  }
  const requestId = `ccr_${Date.now()}`;
  return res.json({ requestId, destChainId, userAddress, requestedLevel });
});

// POST /api/hr/verification/create
// Create a new verification request from HR system
router.post('/verification/create', async (req: Request, res: Response) => {
  try {
    const { 
      hrRequestId, 
      employeeId, 
      employeeName, 
      employeeEmail, 
      verificationTypes = ['identity', 'employment', 'education', 'criminal', 'credit']
    } = req.body || {};

    if (!hrRequestId || !employeeId || !employeeName || !employeeEmail) {
      return res.status(400).json({ 
        error: 'hrRequestId, employeeId, employeeName, and employeeEmail are required' 
      });
    }

    const ticketId = uuidv4();
    const verificationUrl = `${process.env.UI_BASE_URL || 'http://localhost:3000'}/employee-verify/${ticketId}`;
    
    const newRequest: HRVerificationRequest = {
      ticketId,
      hrRequestId,
      employeeId,
      employeeName,
      employeeEmail,
      verificationTypes,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verificationUrl
    };

    const requests = await loadHRRequests();
    requests.push(newRequest);
    await saveHRRequests(requests);

    // Update status to sent_to_employee
    newRequest.status = 'sent_to_employee';
    newRequest.updatedAt = new Date().toISOString();
    await saveHRRequests(requests);

    return res.json({
      success: true,
      ticketId,
      verificationUrl,
      status: 'sent_to_employee',
      message: 'Verification request created and sent to employee'
    });

  } catch (error) {
    console.error('Error creating HR verification request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hr/verification/status/:hrRequestId
// Check status of HR verification request
router.get('/verification/status/:hrRequestId', async (req: Request, res: Response) => {
  try {
    const { hrRequestId } = req.params;
    const requests = await loadHRRequests();
    const request = requests.find(r => r.hrRequestId === hrRequestId);

    if (!request) {
      return res.status(404).json({ error: 'HR request not found' });
    }

    return res.json({
      hrRequestId: request.hrRequestId,
      status: request.status,
      employeeId: request.employeeId,
      employeeName: request.employeeName,
      verificationTypes: request.verificationTypes,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      verifiedAddress: request.verifiedAddress
    });

  } catch (error) {
    console.error('Error checking HR verification status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hr/verification/ticket/:ticketId
// Get verification request by ticket ID (for employee)
router.get('/verification/ticket/:ticketId', async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const requests = await loadHRRequests();
    const request = requests.find(r => r.ticketId === ticketId);

    if (!request) {
      return res.status(404).json({ error: 'Verification ticket not found' });
    }

    // Return employee-safe information
    return res.json({
      ticketId: request.ticketId,
      employeeId: request.employeeId,
      employeeName: request.employeeName,
      verificationTypes: request.verificationTypes,
      status: request.status,
      createdAt: request.createdAt
    });

  } catch (error) {
    console.error('Error getting verification ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/hr/verification/complete/:ticketId
// Complete employee verification (called internally when signature is verified)
router.post('/verification/complete/:ticketId', async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { signature, signedPayload, verifiedAddress, success } = req.body || {};

    const requests = await loadHRRequests();
    const requestIndex = requests.findIndex(r => r.ticketId === ticketId);

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Verification ticket not found' });
    }

    const request = requests[requestIndex];
    
    if (success) {
      request.status = 'verified';
      request.signature = signature;
      request.signedPayload = signedPayload;
      request.verifiedAddress = verifiedAddress;
    } else {
      request.status = 'failed';
    }
    
    request.updatedAt = new Date().toISOString();
    requests[requestIndex] = request;
    await saveHRRequests(requests);

    return res.json({
      success: true,
      status: request.status,
      message: success ? 'Verification completed successfully' : 'Verification failed'
    });

  } catch (error) {
    console.error('Error completing verification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hr/verification/list
// List all HR verification requests (admin endpoint)
router.get('/verification/list', async (req: Request, res: Response) => {
  try {
    const requests = await loadHRRequests();
    return res.json({ requests });
  } catch (error) {
    console.error('Error listing verification requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
