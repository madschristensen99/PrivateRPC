/**
 * SwapD Controller for PrivateRPC
 * 
 * Handles the API endpoints for interacting with the SwapD daemon
 * for Monero atomic swaps.
 */

import { Request, Response } from 'express';
import SwapDClient from '../services/swapd-client';
import { logger } from '../utils/logger';

export class SwapDController {
  private swapdClient: SwapDClient;
  
  constructor(swapdClient: SwapDClient) {
    this.swapdClient = swapdClient;
    logger.info('SwapD Controller initialized');
  }

  /**
   * Ping the SwapD daemon to check if it's alive
   */
  async ping(req: Request, res: Response): Promise<void> {
    try {
      const isAlive = await this.swapdClient.ping();
      res.status(200).json({
        success: true,
        isAlive
      });
    } catch (error: any) {
      logger.error(`Error pinging SwapD: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Query all offers from peers on the network
   */
  async queryAllOffers(req: Request, res: Response): Promise<void> {
    try {
      const { searchTime } = req.query;
      const result = await this.swapdClient.queryAllOffers(
        searchTime ? parseInt(searchTime as string) : undefined
      );
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      logger.error(`Error querying all offers: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Query offers from a specific peer
   */
  async queryPeerOffers(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      logger.error(`Error querying peer offers: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Make a new swap offer
   */
  async makeOffer(req: Request, res: Response): Promise<void> {
    try {
      const { minAmount, maxAmount, exchangeRate, ethAsset, relayerEndpoint, relayerFee } = req.body;
      
      if (!minAmount || !maxAmount || !exchangeRate) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }
      
      const result = await this.swapdClient.makeOffer(
        minAmount,
        maxAmount,
        exchangeRate,
        ethAsset || 'ETH',
        relayerEndpoint,
        relayerFee
      );
      
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      logger.error(`Error making offer: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Take an existing swap offer
   */
  async takeOffer(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      logger.error(`Error taking offer: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get ongoing swaps
   */
  async getOngoingSwaps(req: Request, res: Response): Promise<void> {
    try {
      const { offerId } = req.query;
      const result = await this.swapdClient.getOngoingSwaps(offerId as string);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      logger.error(`Error getting ongoing swaps: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get past swaps
   */
  async getPastSwaps(req: Request, res: Response): Promise<void> {
    try {
      const { offerId } = req.query;
      const result = await this.swapdClient.getPastSwaps(offerId as string);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      logger.error(`Error getting past swaps: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get the status of a swap
   */
  async getSwapStatus(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      logger.error(`Error getting swap status: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Cancel a swap
   */
  async cancelSwap(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      logger.error(`Error cancelling swap: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get suggested exchange rate
   */
  async getSuggestedExchangeRate(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.swapdClient.getSuggestedExchangeRate();
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      logger.error(`Error getting suggested exchange rate: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get balances
   */
  async getBalances(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.swapdClient.getBalances();
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      logger.error(`Error getting balances: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default SwapDController;
