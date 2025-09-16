import React from 'react';

const subnets = [
  {
    name: 'EU Subnet',
    chainId: '1337001',
    compliance: 'GDPR',
    color: '#10b981',
    desc: 'Europe (GDPR Compliant)',
    rpc: 'https://eu.rpc.avax-credchain.local'
  },
  {
    name: 'US Subnet',
    chainId: '1337002',
    compliance: 'EERC',
    color: '#6366f1',
    desc: 'United States (EERC Compliant)',
    rpc: 'https://us.rpc.avax-credchain.local'
  },
  {
    name: 'IN Subnet',
    chainId: '1337003',
    compliance: 'DPDP',
    color: '#f59e0b',
    desc: 'India (DPDP Compliant)',
    rpc: 'https://in.rpc.avax-credchain.local'
  }
];

export default function SubnetDiagram() {
  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 18 }}>Avalanche Subnet Architecture</h2>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 40 }}>
        {subnets.map((s, i) => (
          <div key={s.chainId} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: 110, height: 110, borderRadius: '50%',
              background: s.color, color: '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto', fontWeight: 700, fontSize: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.08)'
            }}>
              {s.name}
              <div style={{ fontSize: 13, fontWeight: 400, marginTop: 4 }}>{s.compliance}</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 15, fontWeight: 500 }}>{s.desc}</div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>Chain ID: <b>{s.chainId}</b></div>
            <div style={{ marginTop: 2, fontSize: 12, color: '#64748b', wordBreak: 'break-all' }}>RPC: {s.rpc}</div>
          </div>
        ))}
      </div>
      <svg width="100%" height="80" style={{ marginTop: -10, marginBottom: 0 }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L8,4 L0,8 Z" fill="#7c3aed" />
          </marker>
        </defs>
        <line x1="18%" y1="30" x2="50%" y2="30" stroke="#7c3aed" strokeWidth="3" markerEnd="url(#arrow)" />
        <line x1="50%" y1="30" x2="82%" y2="30" stroke="#7c3aed" strokeWidth="3" markerEnd="url(#arrow)" />
        <text x="34%" y="22" fontSize="14" fill="#7c3aed">ICM / Teleporter</text>
        <text x="66%" y="22" fontSize="14" fill="#7c3aed">ICM / Teleporter</text>
      </svg>
      <div style={{ textAlign: 'center', marginTop: 18, color: '#7c3aed', fontWeight: 500 }}>
        <span style={{ fontSize: 18 }}>Powered by Avalanche Subnets</span>
        <img src="/logo.svg" alt="Avalanche" style={{ height: 28, marginLeft: 10, verticalAlign: 'middle' }} />
      </div>
    </div>
  );
}
