import React, { useState } from 'react';
import Wallet from '../components/Wallet';
import { getProvider, signVerificationPayload, submitRelayerJob, pollJob } from '../lib/sdk';

export default function VerifyPage() {
  const [signed, setSigned] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSignAndSubmit() {
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const meta = { destChainId: 1337001, attestationLevel: 1, nonce: Math.floor(Date.now()/1000), userAddress: address };
      const signedPayload = await signVerificationPayload(signer, meta);
      setSigned(signedPayload);

      const res = await submitRelayerJob(signedPayload);
      setJobId(res.jobId);
      setStatus('queued');

      await pollJob(res.jobId, (s)=> setStatus(s.status));
    } catch (err:any) {
      console.error('submit failed', err);
      alert('submit failed: ' + (err.message || String(err)));
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo">C</div>
          <div>
            <h1 className="h1">Verify (Demo)</h1>
            <div className="small">Sign a demo payload and submit to the relayer</div>
          </div>
        </div>
        <div className="controls">
          <div className={`status ${status === 'done' ? 'ok' : status === 'processing' ? 'warn' : 'off'}`}>{status || 'idle'}</div>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div className="card">
            <Wallet />
            <p className="small" style={{ marginTop: 12 }}>Connect a wallet and press the button to sign a demo payload and submit to the relayer.</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={handleSignAndSubmit}>Sign & Submit</button>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <h3>Signed payload</h3>
            {signed ? (
              <pre className="code">{JSON.stringify(signed, null, 2)}</pre>
            ) : (
              <div className="small">No signed payload yet.</div>
            )}
            {jobId && <div style={{ marginTop: 10 }} className="small">Job: <span style={{ fontFamily: 'monospace' }}>{jobId}</span> — Status: {status}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
