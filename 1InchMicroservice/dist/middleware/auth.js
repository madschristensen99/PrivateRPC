"use strict";
/**
 * Authentication middleware for PrivateRPC
 *
 * Provides API key authentication for protected routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuth = void 0;
const logger_1 = require("../utils/logger");
// Simple API key authentication middleware
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    // Skip authentication if API_KEY is not set in environment variables
    // This allows for development without authentication
    if (!process.env.API_KEY) {
        logger_1.logger.warn('API key authentication is disabled. Set API_KEY environment variable to enable.');
        return next();
    }
    // Check if API key is provided and matches
    if (!apiKey || apiKey !== process.env.API_KEY) {
        logger_1.logger.warn(`Unauthorized API access attempt from ${req.ip}`);
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid API key'
        });
    }
    next();
};
exports.apiKeyAuth = apiKeyAuth;
exports.default = exports.apiKeyAuth;
