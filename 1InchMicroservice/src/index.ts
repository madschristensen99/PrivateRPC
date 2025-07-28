/**
 * PrivateRPC Main Application
 * 
 * This is the entry point for the PrivateRPC microservice that enables
 * private, gas-less, atomic ETH ↔ XMR swaps.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';

// Import configuration
import { SERVER, BLOCKCHAIN, RATE_LIMIT, SWAPD } from './config';

// Import services
import OneInchService from './services/oneinch-service';
import SwapDClient from './services/swapd-client';
import LitClient from './services/lit-client';
import RpcServer from './services/rpc-server';

// Import controllers
import SwapController from './controllers/swap-controller';
import SwapDController from './controllers/swapd-controller';

// Import routes
import createSwapRoutes from './routes/swap-routes';
import createSwapDRoutes from './routes/swapd-routes';

// Import middleware
import apiKeyAuth from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

// Import logger
import { logger } from './utils/logger';

// Initialize Express app
const app = express();

// Apply basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use(
  rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Initialize services
const provider = new ethers.JsonRpcProvider(BLOCKCHAIN.BASE_SEPOLIA_RPC_URL);
const oneInchService = new OneInchService();
const swapdClient = new SwapDClient(SWAPD.RPC_URL);
const litClient = new LitClient();

// Initialize controllers
const swapController = new SwapController(oneInchService, swapdClient, litClient);
const swapdController = new SwapDController(swapdClient);

// Apply routes
app.use('/api/swap', apiKeyAuth as any, createSwapRoutes(swapController));
app.use('/api/swapd', apiKeyAuth as any, createSwapDRoutes(swapdController));

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'PrivateRPC Microservice'
  });
});

// Apply error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize RPC server
const rpcServer = new RpcServer(provider, swapdClient, litClient);
rpcServer.start();

// Start the server
const server = app.listen(SERVER.PORT, () => {
  logger.info(`🚀 PrivateRPC Microservice running on port ${SERVER.PORT}`);
  logger.info(`Environment: ${SERVER.NODE_ENV}`);
  logger.info(`SwapD connected at: ${SWAPD.RPC_URL}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    rpcServer.stop();
    process.exit(0);
  });
});

export default app;
