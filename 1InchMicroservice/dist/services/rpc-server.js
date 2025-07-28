"use strict";
/**
 * RPC Server for PrivateRPC
 *
 * Implements a JSON-RPC 2.0 server that proxies standard Ethereum RPC calls
 * and adds custom PrivateRPC methods for atomic swaps between ETH and XMR.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcServer = void 0;
const express_1 = __importDefault(require("express"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class RpcServer {
    constructor(provider, swapdClient, litClient) {
        this.httpServer = null;
        this.activeSwaps = new Map();
        this.app = (0, express_1.default)();
        this.provider = provider;
        this.swapdClient = swapdClient;
        this.litClient = litClient;
        // Configure middleware
        this.app.use(express_1.default.json());
        // Set up the RPC endpoint
        this.app.post('/', this.handleRpcRequest.bind(this));
    }
    /**
     * Start the RPC server
     */
    start() {
        if (config_1.RPC.ENABLED) {
            this.httpServer = this.app.listen(config_1.RPC.PORT, () => {
                logger_1.logger.info(`🚀 RPC Server running on ${config_1.RPC.HOST}:${config_1.RPC.PORT}`);
            });
        }
        else {
            logger_1.logger.info('RPC Server is disabled by configuration');
        }
    }
    /**
     * Stop the RPC server
     */
    stop() {
        if (this.httpServer) {
            this.httpServer.close();
            this.httpServer = null;
            logger_1.logger.info('RPC Server stopped');
        }
    }
    /**
     * Handle incoming JSON-RPC requests
     */
    async handleRpcRequest(req, res) {
        const request = req.body;
        let response;
        try {
            // Validate the request
            if (!this.isValidRequest(request)) {
                response = this.createErrorResponse(request.id, -32600, 'Invalid Request');
            }
            else if (!this.isMethodSupported(request.method)) {
                response = this.createErrorResponse(request.id, -32601, 'Method not found');
            }
            else {
                // Process the request
                response = await this.processRequest(request);
            }
        }
        catch (error) {
            logger_1.logger.error(`RPC Error: ${error.message}`);
            response = this.createErrorResponse(request?.id || null, -32603, 'Internal error', error.message);
        }
        res.json(response);
    }
    /**
     * Process a JSON-RPC request
     */
    async processRequest(request) {
        const { method, params, id } = request;
        try {
            // Handle custom PrivateRPC methods
            if (method.startsWith('prpc_')) {
                return {
                    jsonrpc: '2.0',
                    id,
                    result: await this.handlePrivateRpcMethod(method, params)
                };
            }
            // Forward standard Ethereum RPC methods to the provider
            // Send the request to Ethereum node
            // Use call method for compatibility with our type definitions
            const result = await this.provider.call({ method, params });
            return {
                jsonrpc: '2.0',
                id,
                result
            };
        }
        catch (error) {
            logger_1.logger.error(`Error processing RPC request: ${error.message}`);
            return this.createErrorResponse(id, -32000, `Error processing request: ${error.message}`);
        }
    }
    /**
     * Handle custom PrivateRPC methods
     */
    async handlePrivateRpcMethod(method, params) {
        switch (method) {
            case 'prpc_createSwap':
                return this.handleCreateSwap(params);
            case 'prpc_getSwapStatus':
                return this.handleGetSwapStatus(params);
            case 'prpc_listSwaps':
                return this.handleListSwaps(params);
            case 'prpc_cancelSwap':
                return this.handleCancelSwap(params);
            case 'prpc_getExchangeRate':
                return this.handleGetExchangeRate(params);
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }
    /**
     * Handle prpc_createSwap method
     * Creates a new atomic swap between ETH and XMR
     */
    async handleCreateSwap(params) {
        const [fromToken, toToken, amount, walletAddress, options] = params;
        try {
            // Validate parameters
            if (!fromToken || !toToken || !amount || !walletAddress) {
                throw new Error('Missing required parameters');
            }
            // Determine swap direction (ETH->XMR or XMR->ETH)
            const isEthToXmr = fromToken.toLowerCase() === 'eth' ||
                fromToken.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
            // Generate a unique swap ID
            const swapId = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes(`${walletAddress}-${Date.now()}-${Math.random()}`)).slice(0, 42);
            // Generate one-time Monero key if needed
            let moneroKey = null;
            if (isEthToXmr) {
                // For ETH->XMR swaps, we need a one-time Monero key
                await this.litClient.connect();
                moneroKey = await this.litClient.generateOneTimeMoneroKey(swapId, walletAddress);
            }
            // Create the appropriate swap based on direction
            let swapDetails;
            if (isEthToXmr) {
                // ETH->XMR swap
                // 1. Create SwapD offer
                const exchangeRate = options?.exchangeRate ||
                    (await this.swapdClient.getSuggestedExchangeRate()).exchangeRate;
                const swapOffer = await this.swapdClient.makeOffer(amount, amount, exchangeRate, 'ETH', options?.relayerEndpoint, options?.relayerFee);
                // 2. Store the swap details
                swapDetails = {
                    id: swapId,
                    type: 'ETH_TO_XMR',
                    status: 'CREATED',
                    fromToken,
                    toToken,
                    amount,
                    walletAddress,
                    offerId: swapOffer.offerID,
                    peerId: swapOffer.peerID,
                    moneroAddress: moneroKey?.address,
                    moneroKeyId: moneroKey?.keyId,
                    createdAt: new Date().toISOString(),
                };
            }
            else {
                // XMR->ETH swap
                // Implementation would depend on your specific requirements
                // This is a placeholder
                swapDetails = {
                    id: swapId,
                    type: 'XMR_TO_ETH',
                    status: 'CREATED',
                    fromToken,
                    toToken,
                    amount,
                    walletAddress,
                    createdAt: new Date().toISOString(),
                };
            }
            // Store the swap details for later reference
            this.activeSwaps.set(swapId, swapDetails);
            return {
                swapId,
                ...swapDetails
            };
        }
        catch (error) {
            logger_1.logger.error(`Error creating swap: ${error.message}`);
            throw error;
        }
    }
    /**
     * Handle prpc_getSwapStatus method
     * Gets the status of an existing swap
     */
    async handleGetSwapStatus(params) {
        const [swapId] = params;
        if (!swapId) {
            throw new Error('Missing required parameter: swapId');
        }
        const swap = this.activeSwaps.get(swapId);
        if (!swap) {
            throw new Error(`Swap not found: ${swapId}`);
        }
        // Get the latest status from SwapD if applicable
        if (swap.offerId) {
            try {
                const swapStatus = await this.swapdClient.getSwapStatus(swap.offerId);
                swap.status = swapStatus.status;
                swap.lastUpdated = new Date().toISOString();
            }
            catch (error) {
                logger_1.logger.error(`Error getting swap status: ${error.message}`);
                // Continue with the last known status
            }
        }
        return swap;
    }
    /**
     * Handle prpc_listSwaps method
     * Lists all active swaps for a wallet address
     */
    async handleListSwaps(params) {
        const [walletAddress, status] = params;
        if (!walletAddress) {
            throw new Error('Missing required parameter: walletAddress');
        }
        // Filter swaps by wallet address and optionally by status
        const swaps = Array.from(this.activeSwaps.values())
            .filter(swap => swap.walletAddress === walletAddress)
            .filter(swap => !status || swap.status === status);
        return { swaps };
    }
    /**
     * Handle prpc_cancelSwap method
     * Cancels an active swap
     */
    async handleCancelSwap(params) {
        const [swapId] = params;
        if (!swapId) {
            throw new Error('Missing required parameter: swapId');
        }
        const swap = this.activeSwaps.get(swapId);
        if (!swap) {
            throw new Error(`Swap not found: ${swapId}`);
        }
        // Cancel the swap in SwapD if applicable
        if (swap.offerId) {
            try {
                await this.swapdClient.cancelSwap(swap.offerId);
            }
            catch (error) {
                logger_1.logger.error(`Error cancelling swap in SwapD: ${error.message}`);
                throw error;
            }
        }
        // Update the swap status
        swap.status = 'CANCELLED';
        swap.lastUpdated = new Date().toISOString();
        this.activeSwaps.set(swapId, swap);
        return {
            success: true,
            swapId,
            status: 'CANCELLED'
        };
    }
    /**
     * Handle prpc_getExchangeRate method
     * Gets the current exchange rate between ETH and XMR
     */
    async handleGetExchangeRate(params) {
        try {
            const rateInfo = await this.swapdClient.getSuggestedExchangeRate();
            return rateInfo;
        }
        catch (error) {
            logger_1.logger.error(`Error getting exchange rate: ${error.message}`);
            throw error;
        }
    }
    /**
     * Check if a request is a valid JSON-RPC request
     */
    isValidRequest(request) {
        return (request &&
            request.jsonrpc === '2.0' &&
            request.method &&
            typeof request.method === 'string' &&
            (request.id === null || typeof request.id === 'string' || typeof request.id === 'number') &&
            (request.params === undefined || Array.isArray(request.params) || typeof request.params === 'object'));
    }
    /**
     * Check if a method is supported
     */
    isMethodSupported(method) {
        // Support custom PrivateRPC methods
        if (method.startsWith('prpc_')) {
            return config_1.RPC.METHODS.includes(method);
        }
        // Support standard Ethereum RPC methods
        return config_1.RPC.METHODS.includes(method);
    }
    /**
     * Create a JSON-RPC error response
     */
    createErrorResponse(id, code, message, data) {
        return {
            jsonrpc: '2.0',
            id: id || '',
            error: {
                code,
                message,
                data
            }
        };
    }
}
exports.RpcServer = RpcServer;
exports.default = RpcServer;
