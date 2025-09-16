import React, { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import axios from 'axios';
import DocsTabs from '../components/DocsTabs';

interface LogEntry {
  timestamp: string;
  type: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

export default function Dashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingVerifications: 0,
    activeSubnets: 3,
    icmMessages: 0
  });

  // Consume SSE events from relayer for real-time job atransitions
  useEffect(() => {
    const es = new EventSource('http://localhost:4000/v1/relayer/events');
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data && data.jobId) {
          const status = data.status;
          let message = '';
          if (data.type === 'snapshot') {
            message = `Job snapshot ${data.jobId} -> ${status}`;
          } else if (data.type === 'update') {
            message = `Job ${data.jobId} status -> ${status}`;
          } else {
            message = `Job ${data.jobId} ${status}`;
          }
          setLogs(prev => [{
            timestamp: new Date().toLocaleTimeString(),
            type: 'relayer',
            message,
            level: status === 'done' ? 'success' : status === 'failed' ? 'error' : 'info'
          }, ...prev.slice(0, 199)]);

          // update pending & icm counters heuristically
          setStats(prev => ({
            ...prev,
            pendingVerifications: Math.max(0, prev.pendingVerifications + (status === 'queued' ? 1 : (status === 'done' || status === 'failed') ? -1 : 0)),
            icmMessages: prev.icmMessages + (status === 'processing' ? 1 : 0)
          }));
        }
      } catch (e) {
        // ignore
      }
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    // Load initial stats
    const loadStats = async () => {
      try {
        const [jobsRes, usersRes] = await Promise.all([
          axios.get('http://localhost:4000/v1/relayer/list'),
          axios.get('http://localhost:4000/api/hr/users')
        ]);
        
        const jobs = jobsRes.data.jobs || {};
        const users = usersRes.data.users || [];
        const pendingJobs = Object.values(jobs).filter((job: any) => 
          job.status === 'pending' || job.status === 'processing'
        ).length;

        setStats({
          totalEmployees: users.length,
          pendingVerifications: pendingJobs,
          activeSubnets: 3,
          icmMessages: Math.floor(Math.random() * 50) + 20
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };

    loadStats();

    // initial stats only; logs now via SSE
    return () => {};
  }, []);

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'relayer': return '�';
      default: return '📝';
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="container">
      <Nav />
      
      <div className="header">
        <div className="brand">
          <div className="logo">📊</div>
          <div>
            <h1 className="h1">CredChain Dashboard</h1>
            <div className="small">Real-time monitoring of Avalanche subnets and verification processes</div>
          </div>
        </div>
        <div className="controls" style={{ display:'flex', gap:12, alignItems:'center' }}>
          <button
            onClick={() => {
              const el = document.getElementById('dev-docs');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            style={{
              background:'#6366f1',
              color:'#fff',
              border:'none',
              padding:'6px 14px',
              borderRadius:6,
              cursor:'pointer',
              fontSize:12,
              fontWeight:500
            }}
          >Developer Docs</button>
          <span className="small" style={{ color: '#10b981' }}>● Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="row" style={{ marginTop: 20 }}>
        <div className="col">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed' }}>{stats.totalEmployees}</div>
            <div className="small">Total Employees</div>
          </div>
        </div>
        <div className="col">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pendingVerifications}</div>
            <div className="small">Pending Verifications</div>
          </div>
        </div>
        <div className="col">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{stats.activeSubnets}</div>
            <div className="small">Active Subnets</div>
          </div>
        </div>
        <div className="col">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>{stats.icmMessages}</div>
            <div className="small">ICM Messages</div>
          </div>
        </div>
      </div>

      {/* Subnet Status */}
      <div className="row" style={{ marginTop: 20 }}>
        <div className="col">
          <div className="card">
            <h3>Subnet Status</h3>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 15 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', margin: '0 auto' }}>EU</div>
                <div className="small" style={{ marginTop: 5 }}>GDPR Compliant</div>
                <div className="small" style={{ color: '#10b981' }}>● Online</div>
              </div>
              
              <div style={{ flex: 1, textAlign: 'center' }}>
                <svg width="100%" height="40">
                  <defs>
                    <marker id="arrow1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 z" fill="#7c3aed" />
                    </marker>
                    <marker id="arrow2" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,3 L6,0 L6,6 z" fill="#10b981" />
                    </marker>
                  </defs>
                  <line x1="10" y1="15" x2="90%" y2="15" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#arrow1)" />
                  <line x1="90%" y1="25" x2="10" y2="25" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow2)" />
                </svg>
                <div className="small">ICM Bridge</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', margin: '0 auto' }}>US</div>
                <div className="small" style={{ marginTop: 5 }}>EERC Compliant</div>
                <div className="small" style={{ color: '#10b981' }}>● Online</div>
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <svg width="100%" height="40">
                  <line x1="10" y1="15" x2="90%" y2="15" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#arrow1)" />
                  <line x1="90%" y1="25" x2="10" y2="25" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow2)" />
                </svg>
                <div className="small">ICM Bridge</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', margin: '0 auto' }}>IN</div>
                <div className="small" style={{ marginTop: 5 }}>DPDP Compliant</div>
                <div className="small" style={{ color: '#10b981' }}>● Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity Log */}
      <div className="row" style={{ marginTop: 20 }}>
        <div className="col">
          <div className="card">
            <h3>Live System Activity</h3>
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
              {logs.map((log, index) => (
                <div 
                  key={index}
                  style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '4px 0',
                    borderBottom: index < logs.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>{getLogIcon(log.type)}</span>
                  <span style={{ 
                    color: '#6b7280', 
                    minWidth: '80px',
                    marginRight: '8px'
                  }}>
                    {log.timestamp}
                  </span>
                  <span style={{ 
                    color: getLogColor(log.level),
                    minWidth: '60px',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    marginRight: '8px'
                  }}>
                    {log.type}
                  </span>
                  <span style={{ flex: 1 }}>{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '50px' }}>
                  Waiting for system activity...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Developer Docs Section */}
      <div className="row" style={{ marginTop: 20 }} id="dev-docs">
        <div className="col">
          <DocsTabs />
        </div>
      </div>
    </div>
  );
}