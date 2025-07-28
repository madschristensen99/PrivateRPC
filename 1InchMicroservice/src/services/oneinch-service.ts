/**
 * 1inch Service for PrivateRPC
 * 
 * This service handles interactions with the 1inch Fusion SDK for creating
 * and managing escrows for atomic swaps.
 */

import { ethers } from 'ethers';
import { 
  FusionSDK, 
  NetworkEnum, 
  Web3Like, 
  PrivateKeyProviderConnector,
  OrderStatus
} from '@1inch/fusion-sdk';
import axios from 'axios';
import { BLOCKCHAIN, API_KEYS, CONTRACTS } from '../config';
import { logger } from '../utils/logger';

// Define the interface for SwapCreatorAdapter contract
interface SwapCreatorAdapterInterface extends ethers.BaseContract {
  createEscrow(
    salt: string,
    recipient: string,
    amount: string | bigint,
    srcToken: string,
    dstToken: string,
    deadline: number,
    delay: number,
    extraData: string,
    overrides?: ethers.Overrides
  ): Promise<ethers.ContractTransactionResponse>;
  
  predictEscrowAddress(
    salt: string,
    recipient: string,
    amount: string | bigint,
    srcToken: string,
    dstToken: string,
    deadline: number,
    delay: number,
    extraData: string
  ): Promise<string>;
}

export class OneInchService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private fusionSdk: FusionSDK;
  private swapCreatorAdapter: SwapCreatorAdapterInterface;
  
  // ABI for SwapCreatorAdapter
  private SWAP_CREATOR_ADAPTER_ABI = [
    "function createEscrow(bytes32,address,uint256,address,address,uint48,uint48,bytes) external payable",
    "function predictEscrowAddress(bytes32,address,uint256,address,address,uint48,uint48,bytes) external view returns (address)"
  ];

  constructor() {
    // Initialize Ethereum provider
    this.provider = new ethers.JsonRpcProvider(BLOCKCHAIN.BASE_SEPOLIA_RPC_URL);
    
    // Initialize wallet
    this.wallet = new ethers.Wallet(BLOCKCHAIN.PRIVATE_KEY, this.provider);
    
    // Create a provider connector for the 1inch Fusion SDK
    const provider = this.provider; // Store reference to provider
    const ethersProviderConnector: Web3Like = {
      eth: {
        call(transactionConfig: any): Promise<string> {
          return provider.call(transactionConfig);
        },
      },
      extend(): void {}
    };
    
    // Create a private key provider connector
    const connector = new PrivateKeyProviderConnector(
      BLOCKCHAIN.PRIVATE_KEY,
      ethersProviderConnector as any
    );
    
    // Initialize 1inch Fusion SDK
    this.fusionSdk = new FusionSDK({
      url: 'https://api.1inch.dev/fusion',
      network: BLOCKCHAIN.NETWORK,
      blockchainProvider: connector,
      authKey: API_KEYS.ONEINCH_API_KEY
    });
    
    // Initialize contract instance with the proper interface
    this.swapCreatorAdapter = new ethers.Contract(
      CONTRACTS.SWAP_CREATOR_ADAPTER_ADDRESS,
      this.SWAP_CREATOR_ADAPTER_ABI,
      this.provider
    ) as unknown as SwapCreatorAdapterInterface;
    
    logger.info('1inch Service initialized');
  }

  /**
   * Get the wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }

  /**
   * Check the health of the 1inch API
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get('https://api.1inch.dev/healthcheck', {
        headers: { 'Authorization': `Bearer ${API_KEYS.ONEINCH_API_KEY}` }
      });
      return response.status === 200;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`1inch health check failed: ${error.message}`);
      } else {
        logger.error('1inch health check failed: Unknown error');
      }
      return false;
    }
  }

  /**
   * Get a quote from 1inch Fusion API
   */
  async getQuote(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    walletAddress: string
  ) {
    const quoteParams = {
      fromTokenAddress,
      toTokenAddress,
      amount,
      walletAddress,
      source: 'privaterpc-microservice'
    };
    
    logger.debug(`Getting quote from 1inch Fusion API: ${JSON.stringify(quoteParams)}`);
    
    try {
      const quote = await this.fusionSdk.getQuote(quoteParams);
      return quote;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Error getting quote from 1inch: ${error.message}`);
      } else {
        logger.error('Error getting quote from 1inch: Unknown error');
      }
      throw error;
    }
  }

  /**
   * Create and submit an order to 1inch Fusion API
   */
  async createAndSubmitOrder(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    walletAddress: string
  ) {
    const orderParams = {
      fromTokenAddress,
      toTokenAddress,
      amount,
      walletAddress,
      source: 'privaterpc-microservice'
    };
    
    logger.debug(`Creating order with 1inch Fusion API: ${JSON.stringify(orderParams)}`);
    
    try {
      // Create an order based on the params
      const preparedOrder = await this.fusionSdk.createOrder(orderParams);
      
      // Submit the order to 1inch Fusion API
      const orderInfo = await this.fusionSdk.submitOrder(preparedOrder.order, preparedOrder.quoteId);
      
      return {
        preparedOrder,
        orderInfo
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Error creating/submitting order to 1inch: ${error.message}`);
      } else {
        logger.error('Error creating/submitting order to 1inch: Unknown error');
      }
      throw error;
    }
  }

  /**
   * Get the status of an order
   */
  async getOrderStatus(orderHash: string) {
    try {
      const orderStatus = await this.fusionSdk.getOrderStatus(orderHash);
      return orderStatus;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Error getting order status from 1inch: ${error.message}`);
      } else {
        logger.error('Error getting order status from 1inch: Unknown error');
      }
      throw error;
    }
  }

  /**
   * Create an escrow for an atomic swap
   */
  async createEscrow(
    orderHash: string,
    recipient: string,
    amount: string | bigint,
    fromTokenAddress: string,
    toTokenAddress: string,
    deadline: number = 3600 // Default 1 hour
  ) {
    try {
      // Generate claim and refund conditions based on the order hash
      const claimCondition = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('claim-' + orderHash));
      const refundCondition = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('refund-' + orderHash));
      const nonce = Date.now(); // Use timestamp as nonce for simplicity
      
      // Generate a unique salt based on the order hash
      const salt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`salt-${orderHash}-${Date.now()}`));
      
      // Calculate deadline timestamp
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline;
      
      // Encode the extra data for the createEscrow function
      const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'bytes32', 'uint256'],
        [claimCondition, refundCondition, nonce]
      );
      
      // Ensure amount is properly handled as wei
      const amountBigInt = BigInt(amount.toString());
      
      // Only include value if we're dealing with native ETH
      const txOptions: ethers.Overrides = {};
      if (fromTokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        txOptions.value = amountBigInt;
      }
      
      // Connect to the SwapCreatorAdapter contract with the wallet
      const connectedContract = new ethers.Contract(
        CONTRACTS.SWAP_CREATOR_ADAPTER_ADDRESS,
        this.SWAP_CREATOR_ADAPTER_ABI,
        this.wallet.connect(this.provider)
      ) as unknown as SwapCreatorAdapterInterface;
      
      logger.info(`Creating escrow for order ${orderHash}`);
      
      // Call createEscrow function with appropriate parameters
      const tx = await connectedContract.createEscrow(
        salt,
        recipient,
        amountBigInt,
        fromTokenAddress,
        toTokenAddress,
        deadlineTimestamp,
        0, // No delay for now
        extraData,
        txOptions
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait(1);
      
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }
      
      logger.info(`Escrow created successfully for order ${orderHash}, tx: ${receipt.hash}`);
      
      // Return the escrow details
      return {
        transactionHash: receipt.hash,
        escrowDetails: {
          claimCondition,
          refundCondition,
          nonce,
          recipient,
          amount: amount.toString(),
          fromToken: fromTokenAddress,
          toToken: toTokenAddress,
          deadline: deadlineTimestamp
        }
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Error creating escrow: ${error.message}`);
      } else {
        logger.error('Error creating escrow: Unknown error');
      }
      throw error;
    }
  }

  /**
   * Predict the escrow address for a potential swap
   */
  async predictEscrowAddress(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    recipient: string
  ) {
    try {
      // Generate mock order hash for prediction
      const mockOrderHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(`${fromTokenAddress}-${toTokenAddress}-${amount}-${Date.now()}`)
      );
      
      // Generate claim and refund conditions
      const claimCondition = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('claim-' + mockOrderHash));
      const refundCondition = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('refund-' + mockOrderHash));
      const nonce = Date.now();
      
      // Encode the extra data
      const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'bytes32', 'uint256'],
        [claimCondition, refundCondition, nonce]
      );
      
      // Call predictEscrowAddress function
      const predictedAddress = await this.swapCreatorAdapter.predictEscrowAddress(
        '0x0000000000000000000000000000000000000000000000000000000000000000', // salt
        recipient,
        amount,
        fromTokenAddress,
        toTokenAddress,
        Math.floor(Date.now() / 1000) + 3600, // 1 hour deadline
        0, // No delay
        extraData
      );
      
      return {
        predictedAddress,
        escrowDetails: {
          claimCondition,
          refundCondition,
          nonce,
          recipient,
          amount,
          fromToken: fromTokenAddress,
          toToken: toTokenAddress
        }
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Error predicting escrow address: ${error.message}`);
      } else {
        logger.error('Error predicting escrow address: Unknown error');
      }
      throw error;
    }
  }

  /**
   * Get a human-readable description of the order status
   */
  getOrderStatusDescription(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.FILLED:
        return 'The order has been successfully filled.';
      case OrderStatus.CANCELLED:
        return 'The order has been cancelled.';
      case OrderStatus.EXPIRED:
        return 'The order has expired.';
      default:
        return `Status: ${status}`;
    }
  }
}

export default OneInchService;
