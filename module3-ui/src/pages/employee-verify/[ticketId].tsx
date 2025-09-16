import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Nav from '../../components/Nav';
import Wallet from '../../components/Wallet';
import { getProvider, signVerificationPayload, submitRelayerJob, pollJob } from '../../lib/sdk';

// Global declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  status: 'pending' | 'in-progress' | 'verified' | 'failed';
  backgroundVerificationRequired: boolean;
  createdAt: string;
}

export default function EmployeeVerifyPage() {
  const router = useRouter();
  const { ticketId } = router.query;
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<'intro' | 'wallet-connect' | 'documents' | 'processing' | 'complete' | 'error'>('intro');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  const addToActivityLog = (message: string) => {
    setActivityLog(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)]);
  };

  // Load employee details from localStorage (POC simulation)
  useEffect(() => {
    if (!ticketId || typeof ticketId !== 'string') return;
    
    const loadEmployee = async () => {
      try {
        const stored = localStorage.getItem('credchain-employees');
        if (stored) {
          const employees: Employee[] = JSON.parse(stored);
          const found = employees.find(emp => emp.id === ticketId);
          if (found) {
            setEmployee(found);
            addToActivityLog(`Verification request loaded for ${found.firstName} ${found.lastName}`);
          } else {
            setError('Employee verification request not found');
          }
        } else {
          setError('No verification requests found');
        }
      } catch (err) {
        setError('Invalid or expired verification link');
        console.error('Error loading employee:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [ticketId]);

  const updateEmployeeStatus = (status: Employee['status']) => {
    if (!employee) return;
    
    const stored = localStorage.getItem('credchain-employees');
    if (stored) {
      const employees: Employee[] = JSON.parse(stored);
      const updatedEmployees = employees.map(emp => 
        emp.id === employee.id ? { ...emp, status } : emp
      );
      localStorage.setItem('credchain-employees', JSON.stringify(updatedEmployees));
      setEmployee({ ...employee, status });
    }
  };

  const connectWallet = async () => {
    try {
      addToActivityLog('Connecting wallet...');
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWalletAddress(address);
      updateEmployeeStatus('in-progress');

      addToActivityLog(`Wallet connected: ${address.substring(0, 6)}...${address.substring(38)}`);
      addToActivityLog('ICM message sent to identity registry');

      // Simulate network activity
      setTimeout(() => {
        addToActivityLog('Identity verification initiated on-chain');
        // Always re-check the latest value from localStorage in case admin toggled the flag after onboarding
        const stored = localStorage.getItem('credchain-employees');
        let needsDocs = employee?.backgroundVerificationRequired;
        if (stored && employee) {
          const employees: Employee[] = JSON.parse(stored);
          const found = employees.find(emp => emp.id === employee.id);
          if (found) needsDocs = found.backgroundVerificationRequired;
        }
        if (needsDocs) {
          setCurrentStep('documents');
          addToActivityLog('Background verification required - requesting documents');
        } else {
          setCurrentStep('processing');
          addToActivityLog('No background verification required - processing identity');
          processVerification();
        }
      }, 1500);

    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      addToActivityLog(`Wallet connection failed: ${err.message}`);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      newFiles.forEach(file => {
        addToActivityLog(`Document uploaded: ${file.name}`);
      });
    }
  };

  const removeFile = (index: number) => {
    const removedFile = uploadedFiles[index];
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    addToActivityLog(`Document removed: ${removedFile.name}`);
  };

  const uploadToPinata = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one document');
      return;
    }

    setIsProcessing(true);
    addToActivityLog('Uploading documents to IPFS via Pinata...');

    try {
      // Simulate Pinata upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockHashes = uploadedFiles.map(() => 
        `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      );

      uploadedFiles.forEach((file, index) => {
        addToActivityLog(`Document uploaded to IPFS: ${file.name} -> ${mockHashes[index]}`);
      });

      addToActivityLog('All documents uploaded successfully');
      addToActivityLog('Background verification API called');
      
      setCurrentStep('processing');
      processVerification();

    } catch (err: any) {
      addToActivityLog(`Upload failed: ${err.message}`);
      setError('Failed to upload documents. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processVerification = async () => {
    addToActivityLog('Processing identity verification...');
    
    try {
      // Get wallet provider and sign verification payload
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      addToActivityLog('Signing verification payload...');
      const meta = { 
        destChainId: 1337001, 
        attestationLevel: employee?.backgroundVerificationRequired ? 2 : 1, 
        nonce: Math.floor(Date.now()/1000), 
        userAddress: address 
      };
      
      const signedPayload = await signVerificationPayload(signer, meta);
      addToActivityLog('Payload signed successfully');
      
      // Submit to relayer
      addToActivityLog('Submitting to relayer...');
      const result = await submitRelayerJob(signedPayload);
      setJobId(result.jobId);
      addToActivityLog(`Relayer job created: ${result.jobId}`);
      
      // Poll for completion
      setVerificationStatus('queued');
      addToActivityLog('ICM cross-chain verification initiated');
      
      let finalStatus: string | null = null;
      await pollJob(result.jobId, (status) => {
        setVerificationStatus(status.status);
        finalStatus = status.status;
        addToActivityLog(`Verification status: ${status.status}`);
        
        if (status.status === 'processing') {
          addToActivityLog('EU subnet: GDPR compliance verified');
          addToActivityLog('US subnet: EERC compliance verified');
          if (employee?.backgroundVerificationRequired) {
            addToActivityLog('Background verification completed');
          }
        }
      });
      
      if (finalStatus === 'done') {
        addToActivityLog('Identity registry updated');
        addToActivityLog('Verification attestation signed');
        addToActivityLog('Cross-chain verification complete');
        updateEmployeeStatus('verified');
        setCurrentStep('complete');
      } else {
        throw new Error('Verification failed or timed out');
      }
      
    } catch (err: any) {
      addToActivityLog(`Verification failed: ${err.message}`);
      updateEmployeeStatus('failed');
      setCurrentStep('error');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <Nav />
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Loading verification request...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <Nav />
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <h2 style={{ color: '#ef4444' }}>❌ Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container">
        <Nav />
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <h2 style={{ color: '#ef4444' }}>Employee not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Nav />
      
      <div className="row">
        <div className="col" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card">
            {currentStep === 'intro' && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <h2>👋 Welcome, {employee.firstName}!</h2>
                <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '30px' }}>
                  Please complete your identity verification to gain access to the CredChain network.
                </p>
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                  <h3>Verification Details</h3>
                  <div style={{ textAlign: 'left', marginTop: '15px' }}>
                    <p><strong>Name:</strong> {employee.firstName} {employee.lastName}</p>
                    <p><strong>Email:</strong> {employee.email}</p>
                    <p><strong>Department:</strong> {employee.department || 'N/A'}</p>
                    <p><strong>Position:</strong> {employee.position || 'N/A'}</p>
                    <p><strong>Background Verification:</strong> {employee.backgroundVerificationRequired ? '✓ Required' : 'Not Required'}</p>
                  </div>
                </div>
                <button 
                  className="btn"
                  onClick={() => setCurrentStep('wallet-connect')}
                  style={{ fontSize: '16px', padding: '12px 24px' }}
                >
                  Start Verification Process
                </button>
              </div>
            )}

            {currentStep === 'wallet-connect' && (
              <div style={{ textAlign: 'center', padding: '48px 24px 36px 24px' }}>
                <h2>🔗 Connect Your Wallet</h2>
                <p style={{ fontSize: '16px', color: '#6b7280', margin: '12px 0 26px' }}>
                  Connect your wallet to verify your identity on the Avalanche network.
                </p>
                <div style={{ maxWidth: '440px', margin: '0 auto', padding:'8px 0' }}>
                  <Wallet />
                </div>
                
                <div style={{ marginTop: '28px' }}>
                  <button 
                    className="btn"
                    onClick={connectWallet}
                    style={{ fontSize: '16px', padding: '12px 24px' }}
                  >
                    Continue with Connected Wallet
                  </button>
                </div>
                
                {walletAddress && (
                  <div style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 14px', borderRadius: '6px', marginTop: '18px', fontSize:14 }}>
                    ✅ Wallet Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                  </div>
                )}
              </div>
            )}

            {currentStep === 'documents' && (
              <div style={{ padding: '40px' }}>
                <h2 style={{ textAlign: 'center' }}>📄 Document Upload</h2>
                <p style={{ textAlign: 'center', fontSize: '16px', color: '#6b7280', marginBottom: '30px' }}>
                  Background verification is required. Please upload your identity documents.
                </p>
                
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h3>Required Documents</h3>
                  <ul style={{ textAlign: 'left', marginTop: '10px' }}>
                    <li>Government-issued ID (Passport, Driver's License, etc.)</li>
                    <li>Proof of address (Utility bill, Bank statement, etc.)</li>
                    <li>Educational certificates (if applicable)</li>
                  </ul>
                </div>

                <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📎</div>
                    <p>Click to upload documents or drag and drop</p>
                    <p className="small">Supports PDF, JPG, PNG files</p>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4>Uploaded Files:</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        backgroundColor: '#f0f9ff',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '5px'
                      }}>
                        <span>📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button 
                          onClick={() => removeFile(index)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ textAlign: 'center' }}>
                  <button 
                    className="btn"
                    onClick={uploadToPinata}
                    disabled={uploadedFiles.length === 0 || isProcessing}
                    style={{ fontSize: '16px', padding: '12px 24px' }}
                  >
                    {isProcessing ? 'Uploading...' : 'Upload Documents & Continue'}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'processing' && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <h2>⏳ Processing Verification</h2>
                <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '30px' }}>
                  Your identity is being verified across the Avalanche network. This may take a few moments.
                </p>
                
                {jobId && (
                  <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <div className="small">Job ID: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{jobId}</span></div>
                    <div className="small">Status: <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{verificationStatus || 'Initializing'}</span></div>
                  </div>
                )}
                
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  border: '4px solid #e5e7eb',
                  borderTop: '4px solid #7c3aed',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 30px'
                }}></div>
                <style jsx>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <p className="small">Please do not close this window while verification is in progress.</p>
              </div>
            )}

            {currentStep === 'complete' && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <h2 style={{ color: '#10b981' }}>✅ Verification Complete!</h2>
                <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '30px' }}>
                  Congratulations! Your identity has been successfully verified on the CredChain network.
                </p>
                <div style={{ backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                  <h3>Next Steps</h3>
                  <p style={{ textAlign: 'left', marginTop: '10px' }}>
                    1. You now have access to the CredChain enterprise network<br/>
                    2. Your verified credentials are stored securely on-chain<br/>
                    3. HR will be notified of your successful verification<br/>
                    4. You can access company resources using your connected wallet
                  </p>
                </div>
                <button 
                  className="btn"
                  onClick={() => router.push('/dashboard')}
                  style={{ fontSize: '16px', padding: '12px 24px' }}
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {currentStep === 'error' && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <h2 style={{ color: '#ef4444' }}>❌ Verification Failed</h2>
                <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '30px' }}>
                  There was an issue verifying your identity. Please contact HR for assistance.
                </p>
                <button 
                  className="btn ghost"
                  onClick={() => {
                    setCurrentStep('intro');
                    setWalletAddress('');
                    setUploadedFiles([]);
                    setError('');
                    updateEmployeeStatus('pending');
                  }}
                  style={{ fontSize: '16px', padding: '12px 24px' }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Activity Log */}
        <div className="col" style={{ maxWidth: '400px' }}>
          <div className="card">
            <h3>🔍 Technical Activity</h3>
            <div style={{ 
              height: '400px', 
              overflowY: 'auto', 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px',
              marginTop: '10px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              {activityLog.map((log, index) => (
                <div 
                  key={index}
                  style={{ 
                    padding: '4px 0',
                    borderBottom: index < activityLog.length - 1 ? '1px solid #e2e8f0' : 'none',
                    color: '#374151'
                  }}
                >
                  {log}
                </div>
              ))}
              {activityLog.length === 0 && (
                <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '50px' }}>
                  Activity will appear here...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
