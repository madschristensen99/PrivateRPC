"use strict";
/**
 * Error handling middleware for PrivateRPC
 *
 * Provides centralized error handling for the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.ApiError = void 0;
const logger_1 = require("../utils/logger");
// Custom error class for API errors
class ApiError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    // Determine status code (default to 500 if not an ApiError)
    const statusCode = 'statusCode' in err ? err.statusCode : 500;
    // Log the error
    logger_1.logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    logger_1.logger.error(err.stack || 'No stack trace available');
    // Send error response
    res.status(statusCode).json({
        success: false,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
exports.errorHandler = errorHandler;
// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
    logger_1.logger.warn(`404 - Route not found - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.originalUrl}`
    });
};
exports.notFoundHandler = notFoundHandler;
exports.default = { ApiError, errorHandler: exports.errorHandler, notFoundHandler: exports.notFoundHandler };
