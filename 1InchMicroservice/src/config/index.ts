/**
 * Configuration module for PrivateRPC 1Inch Microservice
 * 
 * Centralizes all configuration settings and constants for the application
 */

import dotenv from 'dotenv';
import { NetworkEnum } from '@1inch/fusion-sdk';

// Load environment variables
dotenv.config();

// Server configuration
export const SERVER = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Contract addresses
export const CONTRACTS = {
  SWAP_CREATOR_ADAPTER_ADDRESS: '0x14Ab64a2f29f4921c200280988eea59c85266A33',
  SWAP_CREATOR_ADDRESS: '0x07b9c8BF96E553Adec406cC6ab8c41CCD3d53a51',
};

// Blockchain configuration
export const BLOCKCHAIN = {
  BASE_SEPOLIA_RPC_URL: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  BASE_SEPOLIA_CHAIN_ID: 84532,
  NETWORK: NetworkEnum.ETHEREUM, // 1inch Fusion SDK network
  PRIVATE_KEY: process.env.PRIVATE_KEY || '',
};

// API keys
export const API_KEYS = {
  ONEINCH_API_KEY: process.env.ONEINCH_API_KEY || '',
};

// SwapD configuration
export const SWAPD = {
  RPC_URL: process.env.SWAPD_RPC_URL || 'http://127.0.0.1:5000',
};

// Lit Protocol configuration
export const LIT_PROTOCOL = {
  NETWORK: process.env.LIT_NETWORK || 'serrano', // Use 'cayenne' for mainnet
  DEBUG: process.env.LIT_DEBUG === 'true',
};

// RPC configuration
export const RPC = {
  ENABLED: process.env.RPC_ENABLED === 'true',
  PORT: process.env.RPC_PORT || 8545,
  HOST: process.env.RPC_HOST || '0.0.0.0',
  METHODS: [
    'eth_chainId',
    'eth_blockNumber',
    'eth_getBalance',
    'eth_sendTransaction',
    'eth_call',
    'eth_estimateGas',
    'eth_getTransactionCount',
    'eth_getCode',
    'eth_getStorageAt',
    'eth_getBlockByNumber',
    'eth_getBlockByHash',
    'eth_getTransactionByHash',
    'eth_getTransactionReceipt',
    'net_version',
    'prpc_createSwap',
    'prpc_getSwapStatus',
    'prpc_listSwaps',
    'prpc_cancelSwap',
    'prpc_getExchangeRate',
  ],
};

// Rate limiting configuration
export const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
};
