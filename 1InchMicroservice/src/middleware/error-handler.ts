/**
 * Error handling middleware for PrivateRPC
 * 
 * Provides centralized error handling for the application
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Determine status code (default to 500 if not an ApiError)
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  
  // Log the error
  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack || 'No stack trace available');
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  logger.warn(`404 - Route not found - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.originalUrl}`
  });
};

export default { ApiError, errorHandler, notFoundHandler };
