import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { loadOnchainProfile } from '../lib/onchain';
import Nav from '../components/Nav';
import axios from 'axios';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  status: 'pending' | 'in-progress' | 'verified' | 'failed';
  verificationLink?: string;
  backgroundVerificationRequired: boolean;
  createdAt: string;
  reputation?: number;
}

export default function AdminPOC() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [globalBackgroundVerification, setGlobalBackgroundVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [onchainModalOpen, setOnchainModalOpen] = useState(false);
  const [onchainLoading, setOnchainLoading] = useState(false);
  const [onchainProfile, setOnchainProfile] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    backgroundVerificationRequired: false
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      // Load from localStorage for demo purposes (in real app would be from API)
      const stored = localStorage.getItem('credchain-employees');
      if (stored) {
        const parsed = JSON.parse(stored);
        const augmented = parsed.map((e:Employee) => ({
          ...e,
            reputation: e.status === 'verified' ? 80 + Math.floor(Math.random()*20) : e.status === 'in-progress' ? 40 + Math.floor(Math.random()*20) : 10 + Math.floor(Math.random()*10)
        }));
        setEmployees(augmented);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const saveEmployees = (newEmployees: Employee[]) => {
    localStorage.setItem('credchain-employees', JSON.stringify(newEmployees));
    setEmployees(newEmployees);
  };

  const generateVerificationLink = (employeeId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/employee-verify/${employeeId}`;
  };

  const startOnboarding = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const employeeId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const verificationLink = generateVerificationLink(employeeId);
      
      const newEmployee: Employee = {
        id: employeeId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        department: formData.department,
        position: formData.position,
        status: 'pending',
        verificationLink,
        backgroundVerificationRequired: globalBackgroundVerification || formData.backgroundVerificationRequired,
        createdAt: new Date().toISOString()
      };

      const updatedEmployees = [...employees, newEmployee];
      saveEmployees(updatedEmployees);

      // Simulate sending email (in real app would call API)
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert(`Onboarding started for ${formData.firstName} ${formData.lastName}!\n\nVerification link: ${verificationLink}\n\n(In a real system, this would be sent via email)`);

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        position: '',
        backgroundVerificationRequired: false
      });
      setShowOnboardingForm(false);

    } catch (err) {
      console.error('Failed to start onboarding:', err);
      alert('Failed to start onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationLink = (employee: Employee) => {
    if (employee.verificationLink) {
      const message = `Verification link for ${employee.firstName} ${employee.lastName}:\n\n${employee.verificationLink}\n\n(In a real system, this would be sent via email)`;
      alert(message);
    }
  };

  const copyVerificationLink = async (employee: Employee) => {
    if (employee.verificationLink) {
      try {
        await navigator.clipboard.writeText(employee.verificationLink);
        alert(`Verification link copied to clipboard for ${employee.firstName} ${employee.lastName}!`);
      } catch (err) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = employee.verificationLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`Verification link copied to clipboard for ${employee.firstName} ${employee.lastName}!`);
      }
    }
  };

  const deleteEmployee = (employeeId: string) => {
    if (confirm('Are you sure you want to delete this employee record?')) {
      const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
      saveEmployees(updatedEmployees);
    }
  };

  const viewOnchain = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setOnchainModalOpen(true);
    setOnchainLoading(true);
    try {
      // For demo: treat email hash as pseudo wallet if not yet connected – in real world we'd store wallet
      const storedWallet = (localStorage.getItem('credchain-wallet-address') || '').trim();
      const addr = storedWallet || '0x000000000000000000000000000000000000dEaD';
      const profile = await loadOnchainProfile(addr);
      setOnchainProfile(profile);
    } catch (e) {
      setOnchainProfile({ error: 'Unable to load on-chain data' });
    } finally {
      setOnchainLoading(false);
    }
  };

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'verified': return '#10b981';
      case 'failed': return '#ef4444';
      case 'in-progress': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: Employee['status']) => {
    switch (status) {
      case 'verified': return '✅';
      case 'failed': return '❌';
      case 'in-progress': return '⏳';
      default: return '⏸️';
    }
  };

  return (
    <>
    <div className="container">
      <Nav />
      
      <div className="header">
        <div className="brand">
          <div className="logo">🛠️</div>
          <div>
            <h1 className="h1">Admin/Debug Panel</h1>
            <div className="small">Employee onboarding and verification management</div>
          </div>
        </div>
        <div className="controls">
          <button 
            className="btn"
            onClick={() => setShowOnboardingForm(!showOnboardingForm)}
          >
            {showOnboardingForm ? 'Cancel' : 'Start Onboarding'}
          </button>
        </div>
      </div>

      {/* Global Settings */}
      <div className="row" style={{ marginTop: 20 }}>
        <div className="col">
          <div className="card">
            <h3>Global Settings</h3>
            <div style={{ marginTop: 15 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={globalBackgroundVerification}
                  onChange={(e) => setGlobalBackgroundVerification(e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ fontWeight: globalBackgroundVerification ? 'bold' : 'normal' }}>
                  Force Background Verification for All New Employees
                </span>
              </label>
              <div className="small" style={{ marginTop: 5, marginLeft: 30 }}>
                When enabled, all new employees will be required to upload documents for background verification
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Form */}
      {showOnboardingForm && (
        <div className="row" style={{ marginTop: 20 }}>
          <div className="col">
            <div className="card">
              <h3>Start Employee Onboarding</h3>
              <div style={{ marginTop: 15 }}>
                <div className="row">
                  <div className="col">
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="col">
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                
                <div className="row" style={{ marginTop: 15 }}>
                  <div className="col">
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="col">
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    >
                      <option value="">Select department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="HR">Human Resources</option>
                      <option value="Finance">Finance</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                </div>
                
                <div className="row" style={{ marginTop: 15 }}>
                  <div className="col">
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                      Position
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="Enter job title/position"
                    />
                  </div>
                  <div className="col">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 30, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.backgroundVerificationRequired}
                        onChange={(e) => setFormData({...formData, backgroundVerificationRequired: e.target.checked})}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <span>Require background verification for this employee</span>
                    </label>
                  </div>
                </div>
                
                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                  <button 
                    className="btn"
                    onClick={startOnboarding}
                    disabled={loading}
                  >
                    {loading ? 'Starting...' : 'Generate Verification Link'}
                  </button>
                  <button 
                    className="btn ghost"
                    onClick={() => setShowOnboardingForm(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="row" style={{ marginTop: 20 }}>
        <div className="col">
          <div className="card">
            <h3>Employee Verification Status</h3>
            {employees.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                No employees added yet. Click "Start Onboarding" to add your first employee.
              </div>
            ) : (
              <div style={{ marginTop: 15 }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Employee</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Department</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Reputation</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Background Verification</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Created</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="small" style={{ color: '#6b7280' }}>
                              {employee.email}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
                          <div>{employee.department || 'N/A'}</div>
                          <div className="small" style={{ color: '#6b7280' }}>
                            {employee.position || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{fontWeight:'bold'}}>{employee.reputation ?? '—'}</div>
                          <div className="small" style={{ color: '#6b7280' }}>{employee.reputation ? (employee.reputation > 90 ? 'Gold' : employee.reputation > 70 ? 'Silver' : 'Bronze') : ''}</div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
                          <span style={{ 
                            color: getStatusColor(employee.status),
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}>
                            {getStatusIcon(employee.status)} {employee.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
                          {employee.backgroundVerificationRequired ? (
                            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>✓ Required</span>
                          ) : (
                            <span style={{ color: '#6b7280' }}>Not Required</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
                          <div className="small">
                            {new Date(employee.createdAt).toLocaleDateString()}
                          </div>
                          <div className="small" style={{ color: '#6b7280' }}>
                            {new Date(employee.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            <button
                              className="btn ghost"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                              onClick={() => copyVerificationLink(employee)}
                              title="Copy verification link"
                            >
                              📋 Copy
                            </button>
                            <button
                              className="btn ghost"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                              onClick={() => resendVerificationLink(employee)}
                              title="View verification link"
                            >
                              📧 View
                            </button>
                            <button
                              className="btn ghost"
                              style={{ fontSize: '12px', padding: '4px 8px', color:'#6366f1' }}
                              onClick={() => viewOnchain(employee)}
                              title="View on-chain identity"
                            >
                              🔗 On-chain
                            </button>
                            <button
                              className="btn ghost"
                              style={{ fontSize: '12px', padding: '4px 8px', color: '#ef4444' }}
                              onClick={() => deleteEmployee(employee.id)}
                              title="Delete employee"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
    </div>
  </div>
  {onchainModalOpen && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
        <div style={{ background:'#fff', width:'640px', maxHeight:'80vh', overflowY:'auto', borderRadius:12, padding:'24px 28px', boxShadow:'0 8px 30px rgba(0,0,0,0.15)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h2 style={{ margin:0, fontSize:20 }}>On-chain Profile {selectedEmployee ? `– ${selectedEmployee.firstName}`: ''}</h2>
            <button onClick={()=>setOnchainModalOpen(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer' }}>✕</button>
          </div>
          {onchainLoading && <div style={{ padding:'40px', textAlign:'center' }}>Loading on-chain data...</div>}
          {!onchainLoading && onchainProfile && !onchainProfile.error && (
            <div>
              <h3 style={{ marginTop:0 }}>Identity Registry</h3>
              {onchainProfile.identity ? (
                <div style={{ background:'#f8fafc', padding:12, borderRadius:8, fontSize:14 }}>
                  <div><strong>Jurisdiction:</strong> {onchainProfile.identity.jurisdiction || '—'}</div>
                  <div><strong>IPFS CID:</strong> {onchainProfile.identity.ipfsCid || '—'}</div>
                  <div><strong>Consent:</strong> {onchainProfile.identity.consent ? '✅ Granted' : '❌ Revoked'}</div>
                </div>
              ) : <div style={{ fontSize:14, color:'#6b7280' }}>No identity found on-chain.</div> }
              <h3 style={{ marginTop:24 }}>Attestations</h3>
              {onchainProfile.attestations && onchainProfile.attestations.length > 0 ? (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f1f5f9' }}>
                      <th style={{ textAlign:'left', padding:8, border:'1px solid #e2e8f0' }}>Level</th>
                      <th style={{ textAlign:'left', padding:8, border:'1px solid #e2e8f0' }}>Verifier</th>
                      <th style={{ textAlign:'left', padding:8, border:'1px solid #e2e8f0' }}>Tx Hash</th>
                      <th style={{ textAlign:'left', padding:8, border:'1px solid #e2e8f0' }}>Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onchainProfile.attestations.map((a:any) => (
                      <tr key={a.id}>
                        <td style={{ padding:8, border:'1px solid #e2e8f0', fontWeight:'bold' }}>{a.level}</td>
                        <td style={{ padding:8, border:'1px solid #e2e8f0', fontFamily:'monospace' }}>{a.verifier.substring(0,10)}...</td>
                        <td style={{ padding:8, border:'1px solid #e2e8f0', fontFamily:'monospace' }}>{a.txHash.substring(0,12)}...</td>
                        <td style={{ padding:8, border:'1px solid #e2e8f0' }}>{a.metadataCID || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ fontSize:14, color:'#6b7280' }}>No attestations yet.</div> }
              <div style={{ marginTop:28, textAlign:'right' }}>
                <button className='btn ghost' onClick={()=>setOnchainModalOpen(false)}>Close</button>
              </div>
            </div>
          )}
          {!onchainLoading && onchainProfile && onchainProfile.error && (
            <div style={{ color:'#ef4444', padding:'24px 8px' }}>{onchainProfile.error}</div>
          )}
        </div>
      </div>
    )}
    </>
  );
}