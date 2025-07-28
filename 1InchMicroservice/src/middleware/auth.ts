/**
 * Authentication middleware for PrivateRPC
 * 
 * Provides API key authentication for protected routes
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Simple API key authentication middleware
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  // Skip authentication if API_KEY is not set in environment variables
  // This allows for development without authentication
  if (!process.env.API_KEY) {
    logger.warn('API key authentication is disabled. Set API_KEY environment variable to enable.');
    return next();
  }
  
  // Check if API key is provided and matches
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`Unauthorized API access attempt from ${req.ip}`);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid API key'
    });
  }
  
  next();
};

export default apiKeyAuth;
