import React, { useState } from 'react';
import Nav from '../components/Nav';
import axios from 'axios';

export default function IcmDemo(){
  const [log, setLog] = useState<string[]>([]);
  const [anim, setAnim] = useState<'idle'|'sending'|'done'>('idle');

  function append(msg: string){ setLog(l => [msg, ...l].slice(0, 30)); }

  async function simulateEUtoUS(){
    setAnim('sending');
    append('EU -> ICM: request Level 2 attestation for user 0xAAA...');
    // simulate network latency & call server to create a fake job representing US attestation
    try{
      const res = await axios.post('http://localhost:4000/v1/relayer/create-fake', { userAddress: '0x0000000000000000000000000000000000000001', attestationLevel: 2 });
      append(`US Subnet: created attestation job ${res.data.jobId}`);
      // fake ICM response delivered
      setTimeout(()=>{
        append('ICM: response delivered to EU (encrypted pointer + signed claim)');
        setAnim('done');
      }, 900);
    }catch(e:any){ append('error: '+(e.message||String(e))); setAnim('idle'); }
  }

  return (
    <div className="container">
      <Nav />
      <h1 className="h1">ICM & Avalanche Tools Demo</h1>
      <div style={{ marginTop: 12 }} className="small">Interactive simulation: press <strong>Request Attestation (EU → US)</strong> to simulate a cross-subnet ICM flow and create a fake attestation job in the relayer.</div>

      <div style={{ marginTop: 18 }} className="row">
        <div className="col">
          <div className="card">
            <h3>Subnets</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}><strong>EU</strong><div className="small">GDPR</div></div>
              <div style={{ textAlign: 'center' }}><svg width="140" height="60">
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 z" fill="#7c3aed" />
                  </marker>
                </defs>
                <line x1="10" y1="30" x2={anim==='idle'? '130' : anim==='sending' ? '120' : '130'} y2="30" stroke="#7c3aed" strokeWidth="3" markerEnd="url(#arrow)" style={{ transition:'all 900ms' }} />
              </svg></div>
              <div style={{ textAlign: 'center' }}><strong>US</strong><div className="small">EERC</div></div>
            </div>

            <div style={{ marginTop: 16 }} className="small">Click below to trigger a demo EU→US ICM attestation request (creates a fake relayer job representing the US attestor response).</div>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={()=>{ setAnim('sending'); simulateEUtoUS(); }}>Request Attestation (EU → US)</button>
              <button className="btn ghost" style={{ marginLeft: 8 }} onClick={()=>{ setLog([]); setAnim('idle'); }}>Clear</button>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <h3>ICM Message Log</h3>
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              {log.length===0 && <div className="small">No messages yet</div>}
              {log.map((l, idx) => <div key={idx} className="small">• {l}</div>)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }} className="card">
        <h3>Avalanche Ecosystem Tools</h3>
        <div className="small">AvaCloud, HyperSDK, ICM, EERC, Core Wallet and WalletConnect are the primary tools used in CredentialChain. This demo simulates ICM calls — in a production demo these would be real ICM messages between subnets.</div>
      </div>

      <div className="footer">CredentialChain — Avalanche Hackathon</div>
    </div>
  );
}

