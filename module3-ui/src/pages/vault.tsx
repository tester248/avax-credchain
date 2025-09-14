import React, { useState } from 'react';
import axios from 'axios';

export default function VaultPage() {
  const [mode, setMode] = useState<'file' | 'json'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      if (mode === 'file') {
        if (!file) throw new Error('No file selected');
        const fd = new FormData();
        fd.append('file', file, file.name);
        const res = await axios.post('http://localhost:4000/api/vault/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setResult(res.data);
      } else {
        if (!jsonText.trim()) throw new Error('No JSON provided');
        let parsed: any;
        try {
          parsed = JSON.parse(jsonText);
        } catch (err) {
          // If not valid JSON, submit as raw string under `data` key
          parsed = { data: jsonText };
        }
        const res = await axios.post('http://localhost:4000/api/vault/upload', parsed, {
          headers: { 'Content-Type': 'application/json' },
        });
        setResult(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Vault Upload</h1>
      <p>
        Upload an encrypted identity vault file or paste vault JSON. The backend will attempt to pin to Pinata if
        `PINATA_API_KEY`/`PINATA_API_SECRET` are set; otherwise it returns a mock URL (for demo).
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <label>
            <input type="radio" checked={mode === 'file'} onChange={() => setMode('file')} /> File upload
          </label>
          <label style={{ marginLeft: 12 }}>
            <input type="radio" checked={mode === 'json'} onChange={() => setMode('json')} /> Paste JSON
          </label>
        </div>

        {mode === 'file' && (
          <div style={{ marginBottom: 12 }}>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
            />
          </div>
        )}

        {mode === 'json' && (
          <div style={{ marginBottom: 12 }}>
            <textarea
              rows={12}
              cols={80}
              placeholder='Paste vault JSON here (or any JSON payload)'
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              style={{ fontFamily: 'monospace', width: '100%' }}
            />
          </div>
        )}

        <div>
          <button type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
        </div>
      </form>

      {error && (
        <div style={{ marginTop: 12, color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 12 }}>
          <h3>Result</h3>
          <pre style={{ background: '#f6f6f6', padding: 12 }}>{JSON.stringify(result, null, 2)}</pre>
          {result.cid && (
            <div style={{ marginTop: 8 }}>
              <a href={result.ipfsGatewayUrl || result.url} target="_blank" rel="noreferrer">Open Storage URL</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
