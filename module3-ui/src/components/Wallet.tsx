import React, { useEffect, useState } from 'react';
import { BrowserProvider, AbiCoder, keccak256, getBytes } from 'ethers';
import WalletConnectProvider from '@walletconnect/web3-provider';

export default function Wallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [wcProvider, setWcProvider] = useState<any>(null);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ((window as any).ethereum) {
      // If multiple providers are present, prefer the first listed provider
      const eth = (window as any).ethereum;
      const chosen = Array.isArray(eth.providers) ? eth.providers[0] : eth;
      const p = new BrowserProvider(chosen);
      setProvider(p);
      setProviderName(chosen?.providerName || chosen?.isMetaMask ? 'Injected' : 'Injected');
      (async () => {
        try {
          const signer = await p.getSigner();
          const addr = await signer.getAddress();
          setAddress(addr);
          setConnected(!!addr);
        } catch (e) {
            // ignore
        }
      })();
      const onAccounts = (accounts: string[]) => {
        setAddress(accounts[0] || null);
        setConnected(!!accounts[0]);
      };
      (window as any).ethereum.on('accountsChanged', onAccounts);
      return () => {
        try { (window as any).ethereum.removeListener('accountsChanged', onAccounts); } catch(e){}
      };
    }
  }, []);

  async function connect() {
    if (!provider) return;
    try {
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const signer = (await provider.getSigner()) as any;
      const addr = await signer.getAddress();
      setAddress(addr);
    } catch (e) {
      console.error('connect failed', e);
    }
  }

  async function connectWalletConnect() {
    setError(null);
    try {
      // Create WalletConnect Provider
      const wc = new WalletConnectProvider({
        infuraId: process.env.NEXT_PUBLIC_INFURA_ID || undefined,
        rpc: { 43114: 'https://api.avax.network/ext/bc/C/rpc' },
        chainId: 43114,
      } as any);
      await wc.enable();
      setWcProvider(wc);
      setProviderName('WalletConnect');
      const p = new BrowserProvider(wc as any);
      setProvider(p);
      const signer = await p.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);
      setConnected(true);

      // Listen for wc disconnect
      wc.on && wc.on('disconnect', () => {
        setAddress(null);
        setProvider(null);
        setWcProvider(null);
        setProviderName(null);
        setConnected(false);
      });
    } catch (e:any) {
      console.error('walletconnect connect failed', e);
      setError(String(e?.message || e));
    }
  }

  async function disconnect() {
    try {
      if (wcProvider && wcProvider.disconnect) {
        await wcProvider.disconnect();
      }
    } catch (e) {
      // ignore
    }
    // For injected provider we cannot programmatically disconnect; clear local state
    setAddress(null);
    setProvider(null);
    setWcProvider(null);
    setProviderName(null);
    setConnected(false);
    setError(null);
  }

  async function signDemo() {
    if (!provider) return;
    try {
      const signer = (await provider.getSigner()) as any;
  const destChainId = 1337002;
  const attestationLevel = 1;
  const nonce = Math.floor(Date.now() / 1000);
  const encoded = new AbiCoder().encode(['uint256','address','uint8','uint256'], [destChainId, address, attestationLevel, nonce]);
  const hash = keccak256(encoded);
  const sig = await signer.signMessage(getBytes(hash));
      return { messageHash: hash, signature: sig, nonce };
    } catch (e) {
      console.error('sign failed', e);
      return null;
    }
  }

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>W</div>
        <div>
          <div style={{ fontWeight: 700 }}>Wallet</div>
          <div className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="kv">{address ? address : 'Not connected'}</span>
            {providerName && <span className="small">({providerName})</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!address ? (
          <>
            <button className="btn ghost" onClick={connect}>Connect Injected</button>
            <button className="btn" onClick={connectWalletConnect}>WalletConnect</button>
          </>
        ) : (
          <>
            <button className="btn ghost" onClick={async ()=>{ const r = await signDemo(); console.log('signed', r); alert('Signed — check console'); }}>Sign Demo</button>
            <button className="btn" onClick={disconnect}>Disconnect</button>
          </>
        )}
      </div>
      <div style={{ width: '100%' }}>
        {error && <div style={{ marginTop: 8, color: 'crimson' }}><strong>Error:</strong> {error}</div>}
        {!address && providerName === 'WalletConnect' && <div style={{ marginTop: 8, fontSize: 12 }}>If you don't see a QR, open your mobile wallet and scan the pairing QR (WalletConnect).</div>}
      </div>
    </div>
  );
}
