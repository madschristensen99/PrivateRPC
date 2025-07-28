declare module 'ethers' {
  export namespace ethers {
    export class Wallet {
      constructor(privateKey: string, provider?: any);
      static createRandom(): Wallet;
      connect(provider: any): Wallet;
      getAddress(): Promise<string>;
      signMessage(message: string): Promise<string>;
      signTransaction(transaction: any): Promise<string>;
      address: string;
      privateKey: string;
    }
    
    export namespace utils {
      export function keccak256(value: any): string;
      export function toUtf8Bytes(value: string): Uint8Array;
      export function formatEther(value: any): string;
      export function parseEther(value: string): any;
    }

    export class JsonRpcProvider {
      constructor(url: string, network?: any);
      getBalance(address: string): Promise<any>;
      getTransactionCount(address: string): Promise<number>;
      call(transaction: any): Promise<string>;
    }

    export class Contract {
      constructor(address: string, abi: any, signerOrProvider: any);
      connect(signerOrProvider: any): Contract;
    }

    export interface BaseContract {}
    export interface Overrides {
      gasLimit?: any;
      gasPrice?: any;
      maxFeePerGas?: any;
      maxPriorityFeePerGas?: any;
      nonce?: any;
      value?: any;
    }
    export interface ContractTransactionResponse {
      hash: string;
      nonce: number;
      blockHash: string | null;
      blockNumber: number | null;
      transactionIndex: number | null;
      confirmations: number;
      from: string;
      rawTransaction: string;
      transaction: any;
      wait(confirmations?: number): Promise<any>;
    }

    export class AbiCoder {
      static defaultAbiCoder(): {
        encode(types: any[], values: any[]): string;
      };
    }

    export const ZeroAddress: string;
    export const ZeroHash: string;
  }

  // Direct exports
  export function keccak256(value: any): string;
  export function toUtf8Bytes(value: string): Uint8Array;
  export function getBigInt(value: string | number): bigint;
  export const JsonRpcProvider: typeof ethers.JsonRpcProvider;
  export const Contract: typeof ethers.Contract;
  export const AbiCoder: typeof ethers.AbiCoder;
  export const ZeroAddress: string;
  export const ZeroHash: string;

  export { ethers };
}
