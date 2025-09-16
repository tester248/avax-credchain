import { ethers } from 'ethers';
// @ts-ignore - path resolution for Next.js relative import
import addresses from '../config/addresses';

// Lightweight ABIs (only needed fragments)
const identityRegistryAbi = [
  'function getIdentity(address user) view returns (string jurisdiction, string ipfsCid, bool consent)'
];
const verificationAttestorAbi = [
  'event AttestationCreated(bytes32 indexed id, address indexed user, uint8 level, address verifier)',
  'function attestations(bytes32 id) view returns (bytes32,address,uint8,string,address)'
];

export interface OnchainIdentity {
  jurisdiction: string;
  ipfsCid: string;
  consent: boolean;
}

export interface OnchainAttestationSummary {
  id: string;
  level: number;
  verifier: string;
  txHash: string;
  metadataCID?: string;
}

export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    const prov = new ethers.BrowserProvider((window as any).ethereum);
    await prov.send('eth_requestAccounts', []);
    return prov;
  }
  throw new Error('No injected provider');
}

export async function fetchIdentity(address: string): Promise<OnchainIdentity | null> {
  try {
    const provider = await getProvider();
    const contract = new ethers.Contract(addresses.identityRegistry, identityRegistryAbi, provider);
    const [jurisdiction, ipfsCid, consent] = await contract.getIdentity(address);
    if (!jurisdiction && !ipfsCid) return null;
    return { jurisdiction, ipfsCid, consent };
  } catch (e) {
    return null;
  }
}

export async function fetchAttestations(address: string, fromBlock?: number, toBlock?: number): Promise<OnchainAttestationSummary[]> {
  try {
    const provider = await getProvider();
    const ca = addresses.verificationAttestor;
    const iface = new ethers.Interface(verificationAttestorAbi);
    const eventTopic = iface.getEvent('AttestationCreated').topicHash;
    const filter = {
      address: ca,
      topics: [eventTopic, undefined, ethers.zeroPadValue(address, 32)],
      fromBlock: fromBlock ?? 0,
      toBlock: toBlock ?? 'latest'
    } as any;
    const logs = await provider.send('eth_getLogs', [filter]);
    return logs.map((l: any) => {
      const parsed = iface.decodeEventLog('AttestationCreated', l.data, l.topics);
      return {
        id: parsed[0],
        level: Number(parsed[2]),
        verifier: parsed[3],
        txHash: l.transactionHash
      } as OnchainAttestationSummary;
    });
  } catch (e) {
    return [];
  }
}

export async function enrichAttestations(attestations: OnchainAttestationSummary[]): Promise<OnchainAttestationSummary[]> {
  try {
    const provider = await getProvider();
    const contract = new ethers.Contract(addresses.verificationAttestor, verificationAttestorAbi, provider);
    const enriched = await Promise.all(attestations.map(async (a) => {
      try {
        const full = await contract.attestations(a.id);
        return { ...a, metadataCID: full[3] };
      } catch {
        return a;
      }
    }));
    return enriched;
  } catch {
    return attestations;
  }
}

export async function loadOnchainProfile(userAddress: string) {
  const [identity, atts] = await Promise.all([
    fetchIdentity(userAddress),
    fetchAttestations(userAddress).then(enrichAttestations)
  ]);
  return { identity, attestations: atts };
}
