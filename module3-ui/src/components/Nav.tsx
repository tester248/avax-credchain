import React from 'react';
import Link from 'next/link';

export default function Nav(){
  return (
    <div style={{ marginBottom: 18 }} className="header">
      <div className="brand">
        <div className="logo">CC</div>
        <div>
          <div style={{ fontWeight:700 }}>CredentialChain</div>
          <div className="small">Avalanche Enterprise Identity Network (Demo)</div>
        </div>
      </div>
      <div className="controls">
        <Link href="/" className="btn ghost">Home</Link>
        <Link href="/verify" className="btn ghost">Verify</Link>
        <Link href="/admin" className="btn ghost">Admin</Link>
        <Link href="/icm-demo" className="btn">ICM Demo</Link>
        <Link href="/vault" className="btn ghost">Vault</Link>
      </div>
    </div>
  );
}
