/**
 * SwapD Routes for PrivateRPC
 * 
 * Defines the API routes for SwapD-related operations
 */

import express from 'express';
import SwapDController from '../controllers/swapd-controller';

export const createSwapDRoutes = (swapdController: SwapDController) => {
  const router = express.Router();

  /**
   * @route GET /api/swapd/ping
   * @description Ping the SwapD daemon to check if it's alive
   * @access Public
   */
  router.get('/ping', swapdController.ping.bind(swapdController));

  /**
   * @route GET /api/swapd/offers
   * @description Query all offers from peers on the network
   * @access Public
   */
  router.get('/offers', swapdController.queryAllOffers.bind(swapdController));

  /**
   * @route GET /api/swapd/offers/:peerId
   * @description Query offers from a specific peer
   * @access Public
   */
  router.get('/offers/:peerId', swapdController.queryPeerOffers.bind(swapdController));

  /**
   * @route POST /api/swapd/offers
   * @description Make a new swap offer
   * @access Public
   */
  router.post('/offers', swapdController.makeOffer.bind(swapdController));

  /**
   * @route POST /api/swapd/take-offer
   * @description Take an existing swap offer
   * @access Public
   */
  router.post('/take-offer', swapdController.takeOffer.bind(swapdController));

  /**
   * @route GET /api/swapd/swaps/ongoing
   * @description Get ongoing swaps
   * @access Public
   */
  router.get('/swaps/ongoing', swapdController.getOngoingSwaps.bind(swapdController));

  /**
   * @route GET /api/swapd/swaps/past
   * @description Get past swaps
   * @access Public
   */
  router.get('/swaps/past', swapdController.getPastSwaps.bind(swapdController));

  /**
   * @route GET /api/swapd/swaps/:id/status
   * @description Get the status of a swap
   * @access Public
   */
  router.get('/swaps/:id/status', swapdController.getSwapStatus.bind(swapdController));

  /**
   * @route DELETE /api/swapd/swaps/:offerId
   * @description Cancel a swap
   * @access Public
   */
  router.delete('/swaps/:offerId', swapdController.cancelSwap.bind(swapdController));

  /**
   * @route GET /api/swapd/exchange-rate
   * @description Get suggested exchange rate
   * @access Public
   */
  router.get('/exchange-rate', swapdController.getSuggestedExchangeRate.bind(swapdController));

  /**
   * @route GET /api/swapd/balances
   * @description Get balances
   * @access Public
   */
  router.get('/balances', swapdController.getBalances.bind(swapdController));

  return router;
};

export default createSwapDRoutes;
