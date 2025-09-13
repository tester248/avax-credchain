declare module '@pinata/sdk' {
  interface PinataResponse {
    ipfsHash: string;
    pinSize?: number;
    timestamp?: string;
  }

  interface PinataSDKOptions {
    pinataApiKey: string;
    pinataSecretApiKey: string;
  }

  class PinataSDK {
    constructor(opts: PinataSDKOptions | string, secret?: string);
    pinFileToIPFS(stream: any): Promise<PinataResponse>;
  }

  export default PinataSDK;
}
