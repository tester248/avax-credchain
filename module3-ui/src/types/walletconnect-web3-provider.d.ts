declare module '@walletconnect/web3-provider' {
  import type { ExternalProvider } from '@ethersproject/providers';
  interface WalletConnectProviderOptions {
    rpc?: Record<number, string>;
    infuraId?: string;
    chainId?: number;
    qrcode?: boolean;
    [key: string]: any;
  }

  class WalletConnectProvider implements ExternalProvider {
    constructor(opts?: WalletConnectProviderOptions);
    enable(): Promise<string[]>;
    disconnect(): Promise<void>;
    on(event: string, cb: (...args: any[]) => void): void;
    removeListener(event: string, cb: (...args: any[]) => void): void;
    request?: (...args: any[]) => Promise<any>;
    // allow indexing for compatibility
    [key: string]: any;
  }

  export default WalletConnectProvider;
}
