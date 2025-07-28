"use strict";
/**
 * SwapD JSON-RPC Client
 *
 * This module provides a client for interacting with the swapd JSON-RPC API
 * to facilitate atomic swaps between ETH and XMR.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapDClient = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class SwapDClient {
    constructor(rpcUrl = config_1.SWAPD.RPC_URL) {
        this.jsonRpcVersion = '2.0';
        this.requestId = 0;
        this.rpcUrl = rpcUrl;
        logger_1.logger.info(`SwapD client initialized with RPC URL: ${rpcUrl}`);
    }
    /**
     * Make a JSON-RPC call to the swapd daemon
     */
    async call(method, params = {}) {
        const requestData = {
            jsonrpc: this.jsonRpcVersion,
            id: (this.requestId++).toString(),
            method,
            params
        };
        try {
            logger_1.logger.debug(`SwapD RPC call: ${method} with params: ${JSON.stringify(params)}`);
            const response = await axios_1.default.post(this.rpcUrl, requestData, {
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.data.error) {
                const errorMsg = `SwapD RPC Error: ${JSON.stringify(response.data.error)}`;
                logger_1.logger.error(errorMsg);
                throw new Error(errorMsg);
            }
            return response.data.result;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const errorMsg = `SwapD Connection Error: ${error.message}`;
                logger_1.logger.error(errorMsg);
                throw new Error(errorMsg);
            }
            logger_1.logger.error(`SwapD Unknown Error: ${error.message}`);
            throw error;
        }
    }
    /**
     * Ping the SwapD daemon to check if it's alive
     */
    async ping() {
        try {
            await this.call('ping', {});
            return true;
        }
        catch (error) {
            logger_1.logger.error(`SwapD ping failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Discover peers on the network via DHT that have active swap offers and gets all their swap offers.
     */
    async queryAllOffers(searchTime = 12) {
        return this.call('net_queryAll', { searchTime });
    }
    /**
     * Query a specific peer for their current active offers.
     */
    async queryPeerOffers(peerID) {
        return this.call('net_queryPeer', { peerID });
    }
    /**
     * Make a new swap offer and advertise it on the network.
     */
    async makeOffer(minAmount, maxAmount, exchangeRate, ethAsset = 'ETH', relayerEndpoint, relayerFee) {
        const params = {
            minAmount,
            maxAmount,
            exchangeRate,
            ethAsset
        };
        if (relayerEndpoint) {
            params.relayerEndpoint = relayerEndpoint;
            if (relayerFee) {
                params.relayerFee = relayerFee;
            }
        }
        return this.call('net_makeOffer', params);
    }
    /**
     * Take an advertised swap offer. This call will initiate and execute an atomic swap.
     */
    async takeOffer(peerID, offerID, providesAmount) {
        return this.call('net_takeOffer', {
            peerID,
            offerID,
            providesAmount
        });
    }
    /**
     * Gets information for ongoing swaps.
     */
    async getOngoingSwaps(offerID) {
        const params = offerID ? { offerID } : {};
        return this.call('swap_getOngoing', params);
    }
    /**
     * Gets information for past swaps.
     */
    async getPastSwaps(offerID) {
        const params = offerID ? { offerID } : {};
        return this.call('swap_getPast', params);
    }
    /**
     * Gets the status of an ongoing swap.
     */
    async getSwapStatus(id) {
        return this.call('swap_getStatus', { id });
    }
    /**
     * Attempts to cancel an ongoing swap.
     */
    async cancelSwap(offerID) {
        return this.call('swap_cancel', { offerID });
    }
    /**
     * Returns the current mainnet exchange rate expressed as the XMR/ETH price ratio.
     */
    async getSuggestedExchangeRate() {
        return this.call('swap_suggestedExchangeRate', {});
    }
    /**
     * Returns combined information of both the Monero and Ethereum account addresses and balances.
     */
    async getBalances() {
        return this.call('personal_balances', {});
    }
}
exports.SwapDClient = SwapDClient;
exports.default = SwapDClient;
