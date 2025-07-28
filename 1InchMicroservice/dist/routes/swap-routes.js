"use strict";
/**
 * Swap Routes for PrivateRPC
 *
 * Defines the API routes for swap-related operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwapRoutes = void 0;
const express_1 = __importDefault(require("express"));
const createSwapRoutes = (swapController) => {
    const router = express_1.default.Router();
    /**
     * @route POST /api/swap/escrow
     * @description Create an escrow for an atomic swap
     * @access Public
     */
    router.post('/escrow', swapController.createEscrow.bind(swapController));
    /**
     * @route POST /api/swap/predict-escrow
     * @description Predict the escrow address for a potential swap
     * @access Public
     */
    router.post('/predict-escrow', swapController.predictEscrow.bind(swapController));
    /**
     * @route GET /api/swap/order-status/:orderHash
     * @description Get the status of an order
     * @access Public
     */
    router.get('/order-status/:orderHash', swapController.getOrderStatus.bind(swapController));
    /**
     * @route POST /api/swap/integrated
     * @description Create an integrated swap between ETH and XMR
     * @access Public
     */
    router.post('/integrated', swapController.createIntegratedSwap.bind(swapController));
    /**
     * @route GET /api/swap/integrated/:swapId
     * @description Get the status of an integrated swap
     * @access Public
     */
    router.get('/integrated/:swapId', swapController.getIntegratedSwapStatus.bind(swapController));
    return router;
};
exports.createSwapRoutes = createSwapRoutes;
exports.default = exports.createSwapRoutes;
