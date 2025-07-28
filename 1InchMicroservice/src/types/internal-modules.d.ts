declare module '../services/swapd-client' {
  export default class SwapDClient {
    constructor(rpcUrl: string);
    call(method: string, params: any): Promise<any>;
    ping(): Promise<boolean>;
    makeOffer(amount: string, receiveAmount: string, exchangeRate: string, currency: string, relayerEndpoint?: string, relayerFee?: string): Promise<any>;
    getSuggestedExchangeRate(): Promise<any>;
    getSwapStatus(offerId: string): Promise<any>;
    cancelSwap(offerId: string): Promise<any>;
  }
}

declare module '../services/lit-client' {
  export default class LitClient {
    constructor(network: string, debug?: boolean);
    connect(): Promise<void>;
    generateOneTimeMoneroKey(userId: string, swapId: string): Promise<any>;
    retrieveMoneroKey(keyId: string): Promise<any>;
  }
}

declare module '../utils/logger' {
  const logger: {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
  };
  export default logger;
}
