"use strict";
/**
 * Configuration module for PrivateRPC 1Inch Microservice
 *
 * Centralizes all configuration settings and constants for the application
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT = exports.RPC = exports.LIT_PROTOCOL = exports.SWAPD = exports.API_KEYS = exports.BLOCKCHAIN = exports.CONTRACTS = exports.SERVER = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const fusion_sdk_1 = require("@1inch/fusion-sdk");
// Load environment variables
dotenv_1.default.config();
// Server configuration
exports.SERVER = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
};
// Contract addresses
exports.CONTRACTS = {
    SWAP_CREATOR_ADAPTER_ADDRESS: '0x14Ab64a2f29f4921c200280988eea59c85266A33',
    SWAP_CREATOR_ADDRESS: '0x07b9c8BF96E553Adec406cC6ab8c41CCD3d53a51',
};
// Blockchain configuration
exports.BLOCKCHAIN = {
    BASE_SEPOLIA_RPC_URL: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    BASE_SEPOLIA_CHAIN_ID: 84532,
    NETWORK: fusion_sdk_1.NetworkEnum.ETHEREUM, // 1inch Fusion SDK network
    PRIVATE_KEY: process.env.PRIVATE_KEY || '',
};
// API keys
exports.API_KEYS = {
    ONEINCH_API_KEY: process.env.ONEINCH_API_KEY || '',
};
// SwapD configuration
exports.SWAPD = {
    RPC_URL: process.env.SWAPD_RPC_URL || 'http://127.0.0.1:5000',
};
// Lit Protocol configuration
exports.LIT_PROTOCOL = {
    NETWORK: process.env.LIT_NETWORK || 'serrano', // Use 'cayenne' for mainnet
    DEBUG: process.env.LIT_DEBUG === 'true',
};
// RPC configuration
exports.RPC = {
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
exports.RATE_LIMIT = {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
};
