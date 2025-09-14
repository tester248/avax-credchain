import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminPage() {
  const [jobs, setJobs] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [fakeAddr, setFakeAddr] = useState('0x0000000000000000000000000000000000000004');
  const [fakeLevel, setFakeLevel] = useState(1);

  async function loadAll() {
    setLoading(true);
    try {
      const [rJobs, rUsers] = await Promise.all([
        axios.get('http://localhost:4000/v1/relayer/list'),
        axios.get('http://localhost:4000/api/hr/users')
      ]);
      setJobs(rJobs.data.jobs || {});
      setUsers(rUsers.data.users || []);
    } catch (err) {
      console.error('admin load error', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function showJobDetail(id: string) {
    try {
      const r = await axios.get(`http://localhost:4000/v1/relayer/job/${id}`);
      setSelectedJob(r.data.job);
      setSelectedJobId(id);
    } catch (err) {
      console.error('job detail error', err);
      setSelectedJob(null);
      setSelectedJobId(null);
    }
  }

  async function reverifyJob(id: string) {
    try {
      const r = await axios.post(`http://localhost:4000/v1/relayer/reverify/${id}`);
      // refresh list and detail
      await loadAll();
      setSelectedJob(r.data.job);
    } catch (err:any) {
      console.error('reverify error', err);
      alert('reverify failed: ' + (err.message || String(err)));
    }
  }

  async function createFakeJob() {
    setCreating(true);
    try {
      const r = await axios.post('http://localhost:4000/v1/relayer/create-fake', { userAddress: fakeAddr, attestationLevel: Number(fakeLevel) });
      // refresh list and auto-open detail
      await loadAll();
      showJobDetail(r.data.jobId);
    } catch (err) {
      console.error('create fake job error', err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo">A</div>
          <div>
            <h1 className="h1">Admin Dashboard</h1>
            <div className="small">Relayer job list and demo users</div>
          </div>
        </div>
        <div className="controls">
          <button className="btn ghost" onClick={loadAll} disabled={loading}>Refresh</button>
          <button className="btn ghost" onClick={() => { setSelectedJob(null); setSelectedJobId(null); }}>Clear Detail</button>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div className="card">
            <h3>Relayer Jobs</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Verified</th>
                  <th>TxHash</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(jobs).length === 0 && (
                  <tr><td colSpan={6}><em>No jobs</em></td></tr>
                )}
                {Object.entries(jobs).map(([id, job]: any) => (
                  <tr key={id} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'monospace' }} onClick={() => showJobDetail(id)}>{id}</td>
                    <td onClick={() => showJobDetail(id)}>{job.status}</td>
                    <td onClick={() => showJobDetail(id)}>{new Date(job.createdAt).toLocaleString()}</td>
                    <td onClick={() => showJobDetail(id)}>{String(job.meta?.verified)}</td>
                    <td style={{ fontFamily: 'monospace' }} onClick={() => showJobDetail(id)}>{job.txHash || '-'}</td>
                    <td><button className="btn ghost" onClick={() => reverifyJob(id)}>Reverify</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 12 }}>
              <h4>Create Fake Job</h4>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={fakeAddr} onChange={(e)=>setFakeAddr(e.target.value)} style={{ width: '100%', fontFamily: 'monospace' }}/>
                <label style={{ marginLeft: 8 }}>Level:</label>
                <input type="number" value={fakeLevel} onChange={(e)=>setFakeLevel(Number(e.target.value))} style={{ width: 80 }} />
                <button className="btn" onClick={createFakeJob} disabled={creating}>Create</button>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <h3>Job Detail</h3>
            {selectedJob ? (
              <>
                <pre className="code">{JSON.stringify(selectedJob, null, 2)}</pre>
                <div style={{ marginTop: 8 }}>
                  <button className="btn ghost" onClick={() => selectedJobId && showJobDetail(selectedJobId)}>Refresh Detail</button>
                  <button className="btn" style={{ marginLeft: 8 }} onClick={() => selectedJobId && reverifyJob(selectedJobId)}>Reverify</button>
                </div>
              </>
            ) : (
              <div className="small">Select a job from the left to view details</div>
            )}
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <h3>Demo Users</h3>
            <table className="table">
              <thead>
                <tr><th>Address</th><th>Name</th><th>Level</th></tr>
              </thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={3}><em>No users</em></td></tr>}
                {users.map((u: any) => (
                  <tr key={u.address}><td style={{ fontFamily: 'monospace' }}>{u.address}</td><td>{u.name}</td><td>{u.attestationLevel}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="footer">CredentialChain — demo admin</div>
    </div>
  );
}
