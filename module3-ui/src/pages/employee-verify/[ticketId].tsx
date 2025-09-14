import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import Nav from '../../components/Nav';
import Wallet from '../../components/Wallet';
import { sdk } from '../../lib/sdk';

interface VerificationRequest {
  ticketId: string;
  employeeId: string;
  employeeName: string;
  verificationTypes: string[];
  status: string;
  createdAt: string;
}

export default function EmployeeVerifyPage() {
  const router = useRouter();
  const { ticketId } = router.query;
  
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Load verification request details
  useEffect(() => {
    if (!ticketId || typeof ticketId !== 'string') return;
    
    const loadRequest = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/hr/verification/ticket/${ticketId}`);
        if (!response.ok) {
          throw new Error('Verification request not found');
        }
        const data = await response.json();
        setVerificationRequest(data);
      } catch (err) {
        setError('Invalid or expired verification link');
        console.error('Error loading verification request:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [ticketId]);

  const handleVerification = async () => {
    if (!signer || !verificationRequest) return;

    setIsVerifying(true);
    setError('');

    try {
      // Get user address
      const userAddress = await signer.getAddress();
      
      // Create verification payload
      const destChainId = 1337001; // credchainus subnet
      const attestationLevel = 2; // High level verification
      const nonce = Math.floor(Date.now() / 1000);
      
      // Include HR ticket ID in metadata
      const meta = {
        destChainId,
        userAddress,
        attestationLevel,
        nonce,
        hrTicketId: ticketId as string
      };

      // Submit the verification request
      const result = await sdk.submitAttestation(signer, meta);
      
      if (result.success) {
        setVerificationComplete(true);
      } else {
        setError(result.error || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('An error occurred during verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationTypeDisplayName = (type: string) => {
    const names: Record<string, string> = {
      identity: 'Identity Verification',
      employment: 'Employment History',
      education: 'Education Verification',
      criminal: 'Criminal Background Check',
      credit: 'Credit History Check'
    };
    return names[type] || type;
  };

  if (loading) {
    return (
      <>
        <Nav />
        <div className="container">
          <div className="card">
            <div className="loading-spinner"></div>
            <p>Loading verification request...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !verificationRequest) {
    return (
      <>
        <Nav />
        <div className="container">
          <div className="card error">
            <h2>❌ Invalid Verification Link</h2>
            <p>{error}</p>
            <p>Please contact your HR department for a new verification link.</p>
          </div>
        </div>
      </>
    );
  }

  if (verificationComplete) {
    return (
      <>
        <Nav />
        <div className="container">
          <div className="card success">
            <h2>✅ Verification Complete</h2>
            <p>Thank you, <strong>{verificationRequest?.employeeName}</strong>!</p>
            <p>Your identity has been successfully verified using blockchain technology.</p>
            <p>Your HR department will be notified of the completed verification.</p>
            
            <div className="verification-details">
              <h3>Verification Types Completed:</h3>
              <ul>
                {verificationRequest?.verificationTypes.map((type, index) => (
                  <li key={index}>✓ {getVerificationTypeDisplayName(type)}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="container">
        <div className="verification-header">
          <h1>🔐 Employee Identity Verification</h1>
          <p>Secure blockchain-based verification for {verificationRequest?.employeeName}</p>
        </div>

        <div className="verification-content">
          <div className="card verification-details">
            <h2>Verification Request Details</h2>
            <div className="detail-row">
              <label>Employee ID:</label>
              <span>{verificationRequest?.employeeId}</span>
            </div>
            <div className="detail-row">
              <label>Employee Name:</label>
              <span>{verificationRequest?.employeeName}</span>
            </div>
            <div className="detail-row">
              <label>Request Date:</label>
              <span>{verificationRequest?.createdAt ? new Date(verificationRequest.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            
            <h3>Verification Types Required:</h3>
            <ul className="verification-types">
              {verificationRequest?.verificationTypes.map((type, index) => (
                <li key={index} className="verification-type">
                  <span className="type-icon">🔍</span>
                  {getVerificationTypeDisplayName(type)}
                </li>
              ))}
            </ul>
          </div>

          <div className="card verification-action">
            <h2>Complete Your Verification</h2>
            <p>Connect your wallet and sign the verification request to complete the process.</p>
            
            <Wallet onSignerChange={setSigner} />
            
            {signer && (
              <div className="verification-step">
                <h3>Ready to Verify</h3>
                <p>Click the button below to sign your verification request with your connected wallet.</p>
                <button 
                  onClick={handleVerification}
                  disabled={isVerifying}
                  className="btn-primary verification-btn"
                >
                  {isVerifying ? (
                    <>
                      <div className="loading-spinner small"></div>
                      Verifying...
                    </>
                  ) : (
                    '🔐 Sign & Complete Verification'
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="error-message">
                <p>❌ {error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card info-section">
          <h3>🛡️ How This Works</h3>
          <ol>
            <li><strong>Secure Connection:</strong> Connect your wallet (MetaMask, Core Wallet, etc.)</li>
            <li><strong>Digital Signature:</strong> Sign a verification message with your private key</li>
            <li><strong>Blockchain Verification:</strong> Your identity is verified using Avalanche technology</li>
            <li><strong>HR Notification:</strong> Your HR department receives instant verification confirmation</li>
          </ol>
          
          <p className="security-note">
            🔒 <strong>Privacy & Security:</strong> No personal information is stored on the blockchain. 
            Only cryptographic proof of your identity verification is recorded.
          </p>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .verification-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .verification-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .verification-content {
          display: grid;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
          .verification-content {
            grid-template-columns: 1fr 1fr;
          }
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border);
        }

        .detail-row label {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .detail-row span {
          font-weight: 500;
        }

        .verification-types {
          list-style: none;
          padding: 0;
          margin: 1rem 0;
        }

        .verification-type {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          margin: 0.25rem 0;
          background: var(--background-secondary);
          border-radius: 0.5rem;
          border: 1px solid var(--border);
        }

        .type-icon {
          font-size: 1.25rem;
        }

        .verification-step {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: var(--background-secondary);
          border-radius: 0.75rem;
          border: 1px solid var(--border);
        }

        .verification-btn {
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .verification-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .info-section ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }

        .info-section li {
          margin: 0.75rem 0;
          line-height: 1.6;
        }

        .security-note {
          margin-top: 1.5rem;
          padding: 1rem;
          background: var(--background-secondary);
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .card.success {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .card.error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .verification-details ul {
          margin: 1rem 0;
        }

        .verification-details li {
          margin: 0.5rem 0;
          color: var(--success);
          font-weight: 500;
        }

        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
        }

        .loading-spinner.small {
          width: 16px;
          height: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.5rem;
          color: var(--error);
        }
      `}</style>
    </>
  );
}