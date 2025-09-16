import React, { useState } from 'react';
import Nav from '../components/Nav';
import { getProvider, signVerificationPayload, submitRelayerJob, pollJob } from '../lib/sdk';

interface AttestationJob {
  id: string;
  level: number;
  jobId?: string;
  status: 'idle' | 'queued' | 'processing' | 'done' | 'failed';
  logs: string[];
}

export default function MultiAttestPage() {
  const [wallet, setWallet] = useState<string>('');
  const [jobs, setJobs] = useState<AttestationJob[]>([
    { id: 'level1', level: 1, status: 'idle', logs: [] },
    { id: 'level2', level: 2, status: 'idle', logs: [] },
    { id: 'level3', level: 3, status: 'idle', logs: [] }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [aggregateStatus, setAggregateStatus] = useState<'idle' | 'running' | 'complete' | 'partial' | 'failed'>('idle');

  const addLog = (id: string, message: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, logs: [`${new Date().toLocaleTimeString()}: ${message}`, ...j.logs.slice(0,19)] } : j));
  };
  const updateStatus = (id: string, status: AttestationJob['status']) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
  };
  const connect = async () => {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();
    setWallet(addr);
  };
  const launch = async () => {
    setSubmitting(true);
    setAggregateStatus('running');
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      await Promise.all(jobs.map(async (job) => {
        updateStatus(job.id, 'queued');
        addLog(job.id, `Preparing attestation level ${job.level}`);
        const meta = { destChainId: 1337001, attestationLevel: job.level, nonce: Math.floor(Date.now()/1000)+job.level, userAddress: addr };
        const signed = await signVerificationPayload(signer, meta);
        const { jobId } = await submitRelayerJob(signed);
        addLog(job.id, `Relayer job created: ${jobId}`);
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, jobId } : j));
        await pollJob(jobId, (s) => {
          updateStatus(job.id, s.status);
          addLog(job.id, `Status -> ${s.status}`);
          if (s.status === 'processing') addLog(job.id, 'Attestors validating across subnets');
        });
      }));
      const current = jobs.map(j => j.status === 'done');
      if (current.every(Boolean)) setAggregateStatus('complete');
      else if (current.some(Boolean)) setAggregateStatus('partial');
      else setAggregateStatus('failed');
    } catch (e) {
      setAggregateStatus('failed');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="container">
      <Nav />
      <div className="header">
        <div className="brand">
          <div className="logo">🛡️</div>
          <div>
            <h1 className="h1">Multi-Attestation Demo</h1>
            <div className="small">Submit multiple attestation levels concurrently</div>
          </div>
        </div>
        <div className="controls">
          {!wallet && <button className="btn" onClick={connect}>Connect Wallet</button>}
          {wallet && <div className="small" style={{fontWeight:'bold'}}>{wallet.substring(0,6)}...{wallet.substring(38)}</div>}
        </div>
      </div>
      <div className="row" style={{marginTop:20}}>
        <div className="col">
          <div className="card">
            <h3>Attestation Levels</h3>
            <div style={{display:'flex', gap:20, flexWrap:'wrap', marginTop:15}}>
              {jobs.map(job => (
                <div key={job.id} style={{flex:'1 1 250px', border:'1px solid #e2e8f0', borderRadius:8, padding:16, background:'#f8fafc'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <strong>Level {job.level}</strong>
                    <span style={{fontSize:12, fontWeight:'bold', color: job.status==='done'?'#10b981':job.status==='failed'?'#ef4444':job.status==='processing'?'#f59e0b':'#6b7280'}}>{job.status}</span>
                  </div>
                  <div className="small" style={{marginTop:8}}>Represents incremental trust tier {job.level}</div>
                  <div style={{marginTop:10, maxHeight:120, overflowY:'auto', fontFamily:'monospace', fontSize:11, background:'#fff', border:'1px solid #e5e7eb', borderRadius:4, padding:6}}>
                    {job.logs.map((l,i)=>(<div key={i}>{l}</div>))}
                    {job.logs.length===0 && <div style={{color:'#6b7280'}}>No activity yet</div>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:20, display:'flex', gap:10}}>
              <button className="btn" disabled={!wallet||submitting} onClick={launch}>{submitting? 'Submitting...' : 'Launch Multi-Attest'}</button>
              <button className="btn ghost" disabled={submitting} onClick={()=>{setJobs(j=>j.map(x=>({...x,status:'idle',logs:[]}))); setAggregateStatus('idle');}}>Reset</button>
            </div>
            <div style={{marginTop:10}} className="small">Aggregate status: <strong style={{color: aggregateStatus==='complete'?'#10b981':aggregateStatus==='failed'?'#ef4444':aggregateStatus==='partial'?'#f59e0b':'#374151'}}>{aggregateStatus}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
