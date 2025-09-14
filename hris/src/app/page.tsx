'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  email: string;
  joinDate: string;
  status: 'active' | 'inactive';
}

interface BackgroundCheck {
  id: string;
  employeeId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  initiatedBy: string;
  initiatedDate: string;
  completedDate?: string;
  checks: {
    identity: 'pending' | 'passed' | 'failed';
    employment: 'pending' | 'passed' | 'failed';
    education: 'pending' | 'passed' | 'failed';
    criminal: 'pending' | 'passed' | 'failed';
    credit: 'pending' | 'passed' | 'failed';
  };
  notes?: string;
}

// Sample data
const sampleEmployees: Employee[] = [
  {
    id: 'EMP001',
    name: 'John Smith',
    department: 'Engineering',
    position: 'Senior Software Developer',
    email: 'john.smith@company.com',
    joinDate: '2023-01-15',
    status: 'active'
  },
  {
    id: 'EMP002',
    name: 'Sarah Johnson',
    department: 'Marketing',
    position: 'Marketing Manager',
    email: 'sarah.johnson@company.com',
    joinDate: '2023-03-20',
    status: 'active'
  },
  {
    id: 'EMP003',
    name: 'Michael Brown',
    department: 'Finance',
    position: 'Financial Analyst',
    email: 'michael.brown@company.com',
    joinDate: '2023-05-10',
    status: 'active'
  }
];

const sampleBackgroundChecks: BackgroundCheck[] = [
  {
    id: 'BGC001',
    employeeId: 'EMP001',
    status: 'completed',
    initiatedBy: 'HR Manager',
    initiatedDate: '2023-01-10',
    completedDate: '2023-01-14',
    checks: {
      identity: 'passed',
      employment: 'passed',
      education: 'passed',
      criminal: 'passed',
      credit: 'passed'
    }
  },
  {
    id: 'BGC002',
    employeeId: 'EMP002',
    status: 'in-progress',
    initiatedBy: 'HR Manager',
    initiatedDate: '2023-03-15',
    checks: {
      identity: 'passed',
      employment: 'passed',
      education: 'pending',
      criminal: 'pending',
      credit: 'pending'
    }
  }
];

export default function EmployeeVerification() {
  const [employeeId, setEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [backgroundCheck, setBackgroundCheck] = useState<BackgroundCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentChecks, setRecentChecks] = useState<BackgroundCheck[]>(sampleBackgroundChecks);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleLookup = async () => {
    if (!employeeId.trim()) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const employee = sampleEmployees.find(emp => 
        emp.id.toLowerCase() === employeeId.toLowerCase()
      );
      
      if (employee) {
        setSelectedEmployee(employee);
        const existingCheck = sampleBackgroundChecks.find(check => 
          check.employeeId === employee.id
        );
        setBackgroundCheck(existingCheck || null);
      } else {
        setSelectedEmployee(null);
        setBackgroundCheck(null);
      }
      
      setIsLoading(false);
    }, 1000);
  };

  const handleInitiateBackgroundCheck = async () => {
    if (!selectedEmployee) return;

    setIsLoading(true);

    try {
      // Call CredentialChain API to create verification request
      const response = await fetch('http://localhost:4000/api/hr/verification/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hrRequestId: `HR_${Date.now()}`,
          employeeId: selectedEmployee.id,
          employeeName: selectedEmployee.name,
          employeeEmail: selectedEmployee.email,
          verificationTypes: ['identity', 'employment', 'education', 'criminal', 'credit']
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create verification request');
      }

      const result = await response.json();
      
      // Create new check record with CredentialChain integration
      const newCheck: BackgroundCheck = {
        id: result.ticketId,
        employeeId: selectedEmployee.id,
        status: 'pending',
        initiatedBy: 'HR Manager',
        initiatedDate: new Date().toISOString().split('T')[0],
        checks: {
          identity: 'pending',
          employment: 'pending',
          education: 'pending',
          criminal: 'pending',
          credit: 'pending'
        },
        notes: `CredentialChain verification link: ${result.verificationUrl}`
      };

      setBackgroundCheck(newCheck);
      setRecentChecks(prev => [newCheck, ...prev]);
      
      // Show employee the verification URL
      alert(`Verification request created! Send this link to ${selectedEmployee.name}:\n\n${result.verificationUrl}`);
      
      // Start polling for status updates
      pollVerificationStatus(result.ticketId, selectedEmployee.id);
      
    } catch (error) {
      console.error('Error creating verification request:', error);
      alert('Failed to create verification request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pollVerificationStatus = async (ticketId: string, employeeId: string) => {
    const maxAttempts = 30; // Poll for 5 minutes (30 * 10 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/hr/verification/status/HR_${ticketId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const statusData = await response.json();
          
          // Update background check status based on CredentialChain response
          setBackgroundCheck(prev => {
            if (!prev || prev.employeeId !== employeeId) return prev;
            
            let updatedChecks = { ...prev.checks };
            let status = prev.status;
            
            if (statusData.status === 'verified') {
              // Mark all checks as passed when verification is complete
              updatedChecks = {
                identity: 'passed',
                employment: 'passed',
                education: 'passed',
                criminal: 'passed',
                credit: 'passed'
              };
              status = 'completed';
            } else if (statusData.status === 'failed') {
              status = 'failed';
            } else if (statusData.status === 'employee_signed') {
              status = 'in-progress';
            }
            
            return {
              ...prev,
              status,
              checks: updatedChecks,
              completedDate: statusData.status === 'verified' ? new Date().toISOString().split('T')[0] : prev.completedDate
            };
          });

          // Stop polling if verification is complete or failed
          if (statusData.status === 'verified' || statusData.status === 'failed') {
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (error) {
        console.error('Error polling verification status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        }
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 5000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <ClockIcon className="w-5 h-5 text-blue-600" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCheckStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Employee Verification</h1>
                <p className="text-sm text-gray-600">CredentialChain Integration • Powered by Avalanche</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">HR Manager</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                HM
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Employee ID Input Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Lookup</h2>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="Enter Employee ID (e.g., EMP001)"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={isLoading || !employeeId.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span>Lookup</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading...</span>
            </div>
          </div>
        )}

        {/* Employee Details */}
        {selectedEmployee && !isLoading && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Employee Details</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedEmployee.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {selectedEmployee.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{selectedEmployee.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{selectedEmployee.department}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-medium text-gray-900">{selectedEmployee.position}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Join Date</p>
                  <p className="font-medium text-gray-900">{selectedEmployee.joinDate}</p>
                </div>
              </div>
            </div>

            {/* Background Check Action */}
            <div className="mt-6 pt-6 border-t">
              {!backgroundCheck ? (
                <div>
                  <button
                    onClick={handleInitiateBackgroundCheck}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all flex items-center space-x-2 mb-3"
                  >
                    <ShieldCheckIcon className="w-5 h-5" />
                    <span>Initiate CredentialChain Verification</span>
                  </button>
                  <p className="text-sm text-gray-600">
                    🔗 Powered by Avalanche blockchain technology for secure, instant identity verification
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">CredentialChain Verification Status</h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(backgroundCheck.status)}
                      <span className="capitalize text-sm font-medium">{backgroundCheck.status}</span>
                    </div>
                  </div>
                  
                  {backgroundCheck.notes && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>📧 Employee Verification Link:</strong><br/>
                        A secure verification link has been generated. Share this with the employee to complete their blockchain-based identity verification.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(backgroundCheck.checks).map(([checkType, status]) => (
                      <div key={checkType} className={`p-3 rounded-lg ${getCheckStatusColor(status)}`}>
                        <p className="text-xs font-medium uppercase tracking-wide mb-1">
                          {checkType}
                        </p>
                        <p className="text-sm font-medium capitalize">{status}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Initiated by:</span>
                      <span className="ml-2 font-medium">{backgroundCheck.initiatedBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Initiated:</span>
                      <span className="ml-2 font-medium">{backgroundCheck.initiatedDate}</span>
                    </div>
                    {backgroundCheck.completedDate && (
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <span className="ml-2 font-medium">{backgroundCheck.completedDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Employee Found */}
        {employeeId && !selectedEmployee && !isLoading && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Employee Not Found</h3>
            <p className="text-gray-600">No employee found with ID: {employeeId}</p>
          </div>
        )}

        {/* Recent Background Checks */}
        {recentChecks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Background Checks</h2>
            <div className="space-y-4">
              {recentChecks.slice(0, 5).map((check) => {
                const employee = sampleEmployees.find(emp => emp.id === check.employeeId);
                return (
                  <div key={check.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {employee?.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{employee?.name}</p>
                        <p className="text-sm text-gray-600">{check.employeeId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{check.initiatedDate}</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(check.status)}
                        <span className="capitalize text-sm font-medium">{check.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
