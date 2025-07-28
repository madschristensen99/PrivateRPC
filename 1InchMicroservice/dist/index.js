"use strict";
/**
 * PrivateRPC Main Application
 *
 * This is the entry point for the PrivateRPC microservice that enables
 * private, gas-less, atomic ETH ↔ XMR swaps.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ethers_1 = require("ethers");
// Import configuration
const config_1 = require("./config");
// Import services
const oneinch_service_1 = __importDefault(require("./services/oneinch-service"));
const swapd_client_1 = __importDefault(require("./services/swapd-client"));
const lit_client_1 = __importDefault(require("./services/lit-client"));
const rpc_server_1 = __importDefault(require("./services/rpc-server"));
// Import controllers
const swap_controller_1 = __importDefault(require("./controllers/swap-controller"));
const swapd_controller_1 = __importDefault(require("./controllers/swapd-controller"));
// Import routes
const swap_routes_1 = __importDefault(require("./routes/swap-routes"));
const swapd_routes_1 = __importDefault(require("./routes/swapd-routes"));
// Import middleware
const auth_1 = __importDefault(require("./middleware/auth"));
const error_handler_1 = require("./middleware/error-handler");
// Import logger
const logger_1 = require("./utils/logger");
// Initialize Express app
const app = (0, express_1.default)();
// Apply basic middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Apply rate limiting
app.use((0, express_rate_limit_1.default)({
    windowMs: config_1.RATE_LIMIT.WINDOW_MS,
    max: config_1.RATE_LIMIT.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
}));
// Initialize services
const provider = new ethers_1.ethers.JsonRpcProvider(config_1.BLOCKCHAIN.BASE_SEPOLIA_RPC_URL);
const oneInchService = new oneinch_service_1.default();
const swapdClient = new swapd_client_1.default(config_1.SWAPD.RPC_URL);
const litClient = new lit_client_1.default();
// Initialize controllers
const swapController = new swap_controller_1.default(oneInchService, swapdClient, litClient);
const swapdController = new swapd_controller_1.default(swapdClient);
// Apply routes
app.use('/api/swap', auth_1.default, (0, swap_routes_1.default)(swapController));
app.use('/api/swapd', auth_1.default, (0, swapd_routes_1.default)(swapdController));
// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'PrivateRPC Microservice'
    });
});
// Apply error handling middleware
app.use(error_handler_1.notFoundHandler);
app.use(error_handler_1.errorHandler);
// Initialize RPC server
const rpcServer = new rpc_server_1.default(provider, swapdClient, litClient);
rpcServer.start();
// Start the server
const server = app.listen(config_1.SERVER.PORT, () => {
    logger_1.logger.info(`🚀 PrivateRPC Microservice running on port ${config_1.SERVER.PORT}`);
    logger_1.logger.info(`Environment: ${config_1.SERVER.NODE_ENV}`);
    logger_1.logger.info(`SwapD connected at: ${config_1.SWAPD.RPC_URL}`);
});
// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
        rpcServer.stop();
        process.exit(0);
    });
});
exports.default = app;
