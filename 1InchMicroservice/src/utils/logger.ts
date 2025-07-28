/**
 * Logger utility for PrivateRPC
 * 
 * Provides consistent logging throughout the application
 */

import pino from 'pino';
import { SERVER } from '../config';

// Create a logger instance
export const logger = pino({
  level: SERVER.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

export default logger;
