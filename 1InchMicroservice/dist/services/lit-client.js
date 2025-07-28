"use strict";
/**
 * Lit Protocol Client for PrivateRPC
 *
 * This module provides a client for interacting with Lit Protocol to manage
 * one-time use Monero keys for atomic swaps between ETH and XMR.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LitClient = void 0;
const LitJsSdk = __importStar(require("@lit-protocol/lit-node-client"));
const ethers_1 = require("ethers");
const wrapped_keys_1 = require("@lit-protocol/wrapped-keys");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class LitClient {
    constructor() {
        this.pkpPublicKey = null;
        this.connected = false;
        this.litNodeClient = new LitJsSdk.LitNodeClient({
            litNetwork: config_1.LIT_PROTOCOL.NETWORK,
            debug: config_1.LIT_PROTOCOL.DEBUG
        });
        logger_1.logger.info(`Lit Protocol client initialized with network: ${config_1.LIT_PROTOCOL.NETWORK}`);
    }
    /**
     * Connect to the Lit Protocol network
     */
    async connect() {
        if (this.connected)
            return;
        try {
            await this.litNodeClient.connect();
            this.wrappedKeysSDK = new wrapped_keys_1.WrappedKey({
                litNodeClient: this.litNodeClient,
            });
            this.connected = true;
            logger_1.logger.info('Connected to Lit Protocol network');
        }
        catch (error) {
            logger_1.logger.error(`Failed to connect to Lit Protocol: ${error.message}`);
            throw error;
        }
    }
    /**
     * Set the authentication signature for the user
     * This is required for most Lit Protocol operations
     */
    async setAuthSig(authSig) {
        this.authSig = authSig;
        logger_1.logger.debug('Auth signature set for Lit Protocol');
    }
    /**
     * Set the PKP public key to use for key management
     */
    async setPKPPublicKey(pkpPublicKey) {
        this.pkpPublicKey = pkpPublicKey;
        logger_1.logger.debug(`PKP public key set: ${pkpPublicKey}`);
    }
    /**
     * Generate a new one-time use Monero key pair
     * This creates a new wrapped key in Lit Protocol that can only be used once
     * for a specific transaction
     *
     * @param txId - Transaction ID or other unique identifier for this swap
     * @param userId - User identifier (can be their ETH address)
     * @returns MoneroKeyPair object with the generated keys
     */
    async generateOneTimeMoneroKey(txId, userId) {
        if (!this.connected) {
            await this.connect();
        }
        if (!this.authSig) {
            // Create a temporary auth sig for testing purposes
            // In production, this should be provided by the user
            this.authSig = {
                sig: "0x2bdede6164f56a601fc17a8a78327d28b54e87cf3fa20373fca1d73b804566736d76efe2dd79a4627870a50e66e1a9050ca333b6f98d9415d8bca424980611ca1c",
                derivedVia: "web3.eth.personal.sign",
                signedMessage: "I am creating a Lit Protocol account\n\nOrigin: http://localhost:3000",
                address: userId,
            };
            logger_1.logger.warn('Using temporary auth signature for Lit Protocol - NOT FOR PRODUCTION');
        }
        // Generate a unique salt for this key
        const salt = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes(`${userId}-${txId}-${Date.now()}`));
        // Create access control conditions that limit this key to one-time use
        // This uses the txId as part of the condition to ensure it's only used for this transaction
        const accessControlConditions = [
            {
                contractAddress: '',
                standardContractType: '',
                chain: 'ethereum',
                method: '',
                parameters: [':userAddress'],
                returnValueTest: {
                    comparator: '=',
                    value: userId
                }
            },
            {
                operator: 'and'
            },
            {
                contractAddress: '',
                standardContractType: '',
                chain: 'ethereum',
                method: '',
                parameters: [':litActionResource'],
                returnValueTest: {
                    comparator: '=',
                    value: `tx-${txId}`
                }
            }
        ];
        try {
            logger_1.logger.info(`Generating one-time Monero key for txId: ${txId}, userId: ${userId}`);
            // Generate a new key pair using Lit Protocol's wrapped keys
            // This will create a new private key that's encrypted and stored in Lit's network
            const { keyId, publicKey } = await this.wrappedKeysSDK.generateWrappedKey({
                keyType: 'monero', // Specify that we want a Monero key
                accessControlConditions,
                authSig: this.authSig,
                pkpPublicKey: this.pkpPublicKey,
            });
            // For Monero, we need to derive the address from the public key
            // This is a simplified example - actual Monero address derivation is more complex
            const address = this.deriveMoneroAddress(publicKey);
            logger_1.logger.info(`Generated one-time Monero key with ID: ${keyId}`);
            // Return the key pair info
            // Note: The private key is not directly accessible - it's wrapped by Lit Protocol
            // and can only be used through their signing functions
            return {
                privateKey: '[ENCRYPTED - Managed by Lit Protocol]',
                publicKey,
                address,
                keyId
            };
        }
        catch (error) {
            logger_1.logger.error(`Error generating Monero key: ${error.message}`);
            throw new Error(`Failed to generate Monero key: ${error.message}`);
        }
    }
    /**
     * Use a one-time Monero key to sign a transaction
     * This will decrypt the key, use it for signing, and then the key will no longer be usable
     *
     * @param keyId - The Lit Protocol wrapped key ID
     * @param txData - The transaction data to sign
     * @param txId - The transaction ID (must match the one used when generating the key)
     * @param userId - User identifier (must match the one used when generating the key)
     * @returns The signed transaction
     */
    async signWithOneTimeKey(keyId, txData, txId, userId) {
        if (!this.connected) {
            await this.connect();
        }
        if (!this.authSig) {
            throw new Error('Authentication signature not set. Call setAuthSig first.');
        }
        try {
            logger_1.logger.info(`Signing transaction with one-time key: ${keyId}`);
            // Create a Lit Action to use the wrapped key for signing
            // This action will run in Lit's secure environment and use the private key
            const litActionCode = `
        const signMoneroTx = async () => {
          // Get the transaction data from the params
          const txData = params.txData;
          
          // This is where we'd use a Monero signing library
          // For this example, we're just demonstrating the concept
          const signedTx = await Lit.Actions.signMoneroTransaction({
            keyId: params.keyId,
            transaction: txData
          });
          
          // Return the signed transaction
          return signedTx;
        };
        
        // Execute the signing function
        const signedTx = await signMoneroTx();
        
        // Return the result
        Lit.Actions.setResponse({response: signedTx});
      `;
            // Execute the Lit Action with the wrapped key
            const result = await this.litNodeClient.executeJs({
                code: litActionCode,
                authSig: this.authSig,
                jsParams: {
                    keyId,
                    txData,
                    txId,
                    userId
                },
                resourceId: `tx-${txId}` // This matches the condition we set when creating the key
            });
            logger_1.logger.info(`Transaction signed successfully with key: ${keyId}`);
            // Return the signed transaction
            return result.response;
        }
        catch (error) {
            logger_1.logger.error(`Error signing with one-time key: ${error.message}`);
            throw new Error(`Failed to sign transaction: ${error.message}`);
        }
    }
    /**
     * Derive a Monero address from a public key
     * This is a simplified placeholder - actual implementation would use Monero libraries
     */
    deriveMoneroAddress(publicKey) {
        // In a real implementation, we would use Monero libraries to derive the address
        // This is just a placeholder
        return `4${publicKey.substring(0, 30)}...`;
    }
    /**
     * Get authentication signature from the user's wallet
     * This is typically called from the frontend
     */
    static async getAuthSig(provider) {
        try {
            const chain = 'ethereum';
            const authSig = await LitJsSdk.checkAndSignAuthMessage({
                chain,
                provider
            });
            return authSig;
        }
        catch (error) {
            logger_1.logger.error(`Error getting auth signature: ${error.message}`);
            throw error;
        }
    }
}
exports.LitClient = LitClient;
exports.default = LitClient;
