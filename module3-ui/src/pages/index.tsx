import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from '../components/Nav';

export default function Home() {
  const [abis, setAbis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/contracts/abis');
        setAbis(res.data);
      } catch (e: any) {
        setError(e.message || 'fetch failed');
      }
    };
    fetch();
  }, []);

  return (
    <div className="container">
      <Nav />
      <div className="card">
        <h1 className="h1">Module 3 UI - Demo</h1>
        <p className="small">Purpose: quick frontend to interact with Module 3 API and on-chain artifacts</p>
        {error && <div style={{ color: 'salmon' }}>Error: {error}</div>}
        {!abis && !error && <div className="small">Loading artifacts...</div>}
        {abis && (
          <div style={{ marginTop: 12 }}>
            <h3>Available artifacts</h3>
            <pre className="code">{JSON.stringify(abis, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
