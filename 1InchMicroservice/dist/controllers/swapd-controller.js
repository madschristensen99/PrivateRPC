"use strict";
/**
 * SwapD Controller for PrivateRPC
 *
 * Handles the API endpoints for interacting with the SwapD daemon
 * for Monero atomic swaps.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapDController = void 0;
const logger_1 = require("../utils/logger");
class SwapDController {
    constructor(swapdClient) {
        this.swapdClient = swapdClient;
        logger_1.logger.info('SwapD Controller initialized');
    }
    /**
     * Ping the SwapD daemon to check if it's alive
     */
    async ping(req, res) {
        try {
            const isAlive = await this.swapdClient.ping();
            res.status(200).json({
                success: true,
                isAlive
            });
        }
        catch (error) {
            logger_1.logger.error(`Error pinging SwapD: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * Query all offers from peers on the network
     */
    async queryAllOffers(req, res) {
        try {
            const { searchTime } = req.query;
            const result = await this.swapdClient.queryAllOffers(searchTime ? parseInt(searchTime) : undefined);
            res.status(200).json({
                success: true,
                ...result
            });
        }
        catch (error) {
            logger_1.logger.error(`Error querying all offers: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * Query offers from a specific peer
     */
    async queryPeerOffers(req, res) {
        try {
            const { peerId } = req.params;
            if (!peerId) {
                res.status(400).json({ error: 'Missing peer ID' });
                return;
            }
            const result = await this.swapdClient.queryPeerOffers(peerId);
            res.status(200).json({
                success: true,
                peerId,
                ...result
            });
        }
        catch (error) {
            logger_1.logger.error(`Error querying peer offers: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * Make a new swap offer
     */
    async makeOffer(req, res) {
        try {
            const { minAmount, maxAmount, exchangeRate, ethAsset, relayerEndpoint, relayerFee } = req.body;
            if (!minAmount || !maxAmount || !exchangeRate) {
                res.status(400).json({ error: 'Missing required parameters' });
                return;
            }
            const result = await this.swapdClient.makeOffer(minAmount, maxAmount, exchangeRate, ethAsset || 'ETH', relayerEndpoint, relayerFee);
            res.status(200).json({
                success: true,
                ...result
            });
        }
        catch (error) {
            logger_1.logger.error(`Error making offer: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * Take an existing swap offer
     */
    async takeOffer(req, res) {
        try {
            const { peerId, offerId, providesAmount } = req.body;
            if (!peerId || !offerId || !providesAmount) {
                res.status(400).json({ error: 'Missing required parameters' });
                return;
            }
            await this.swapdClient.takeOffer(peerId, offerId, providesAmount);
            res.status(200).json({
                success: true,
                message: 'Offer taken successfully'
            });
        }
        catch (error) {
            logger_1.logger.error(`Error taking offer: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * Get ongoing swaps
     */
    async getOngoingSwaps(req, res) {
        try {
            const { offerId } = req.query;
            const result = await this.swapdClient.getOngoingSwaps(offerId);
            res.status(200).json({
                success: true,
                ...result
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting ongoing swaps: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * Get past swaps
     */
    async getPastSwaps(req, res) {
        try {
            const { offerId } = req.query;
            const result = await this.swapdClient.getPastSwaps(offerId);
            res.status(200).json({
                success: true,
                ...result
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting past swaps: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * Get the status of a swap
     */
    async getSwapStatus(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ error: 'Missing swap ID' });
                return;
            }
            const result = await this.swapdClient.getSwapStatus(id);
            res.status(200).json({
                success: true,
                id,
                ...result
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting swap status: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * Cancel a swap
     */
    async cancelSwap(req, res) {
        try {
            const { offerId } = req.params;
            if (!offerId) {
                res.status(400).json({ error: 'Missing offer ID' });
                return;
            }
            const result = await this.swapdClient.cancelSwap(offerId);
            res.status(200).json({
                success: true,
                offerId,
                ...result
            });
        }
        catch (error) {
            logger_1.logger.error(`Error cancelling swap: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * Get suggested exchange rate
     */
    async getSuggestedExchangeRate(req, res) {
        try {
            const result = await this.swapdClient.getSuggestedExchangeRate();
            res.status(200).json({
                success: true,
                ...result
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting suggested exchange rate: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * Get balances
     */
    async getBalances(req, res) {
        try {
            const result = await this.swapdClient.getBalances();
            res.status(200).json({
                success: true,
                ...result
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting balances: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.SwapDController = SwapDController;
exports.default = SwapDController;
