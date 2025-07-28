declare module '@lit-protocol/lit-node-client' {
  export class LitNodeClient {
    constructor(config?: any);
    connect(): Promise<void>;
    saveEncryptionKey(params: any): Promise<any>;
    getEncryptionKey(params: any): Promise<any>;
    executeJs(params: any): Promise<any>;
  }

  export function checkAndSignAuthMessage(params: any): Promise<any>;

  export default {
    LitNodeClient,
    checkAndSignAuthMessage
  };
}

declare module '@lit-protocol/wrapped-keys' {
  export class WrappedKey {
    constructor(params: any);
    encryptedKey: string;
    keyId: string;
    publicKey: string;
  }
}

declare module '@lit-protocol/contracts-sdk' {
  export class LitContracts {
    constructor(params: any);
    connect(): Promise<void>;
    pkpNftContract: any;
  }
}

declare module '@lit-protocol/pkp-ethers' {
  export class PKPEthersWallet {
    constructor(params: any);
    connect(provider: any): PKPEthersWallet;
    getAddress(): Promise<string>;
    signMessage(message: string): Promise<string>;
    signTransaction(transaction: any): Promise<string>;
  }
}
