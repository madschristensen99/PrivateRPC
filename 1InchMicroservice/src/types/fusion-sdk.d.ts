declare module '@1inch/fusion-sdk' {
  export enum NetworkEnum {
    ETHEREUM = 1,
    POLYGON = 137,
    BINANCE = 56,
    OPTIMISM = 10,
    ARBITRUM = 42161,
    GNOSIS = 100,
    AVALANCHE = 43114,
    BASE = 8453,
    BASE_SEPOLIA = 84532
  }

  export enum OrderStatus {
    PENDING = 'pending',
    FILLED = 'filled',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired'
  }

  export class PrivateKeyProviderConnector {
    constructor(privateKey: string, rpcUrl: string);
  }

  export class FusionSDK {
    constructor(options: any);

    createOrder(params: {
      fromTokenAddress: string;
      toTokenAddress: string;
      amount: string;
      walletAddress: string;
      receiver?: string;
      preset?: string;
    }): Promise<any>;

    getQuote(params: {
      fromTokenAddress: string;
      toTokenAddress: string;
      amount: string;
      walletAddress: string;
      enableEstimate?: boolean;
    }): Promise<any>;

    submitOrder(order: any, quoteId?: string): Promise<any>;

    getOrderStatus(orderHash: string): Promise<OrderStatus>;
  }

  export class Web3ProviderConnector {
    constructor(web3Provider: any);
  }

  export interface Web3Like {
    eth: {
      call(transactionConfig: any): Promise<string>;
    };
    extend(): void;
  }
}
