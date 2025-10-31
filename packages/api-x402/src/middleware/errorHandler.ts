import { Request, Response, NextFunction } from 'express';
import { X402Error, OracleError, ApiResponse } from '../types';
import logger from '../utils/logger';

/**
 * Error handler middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });
  
  // Handle X402Error
  if (error instanceof X402Error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: {
        timestamp: Date.now(),
      },
    };
    
    res.status(error.statusCode).json(response);
    return;
  }
  
  // Handle OracleError
  if (error instanceof OracleError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: {
        timestamp: Date.now(),
      },
    };
    
    res.status(error.statusCode).json(response);
    return;
  }
  
  // Handle generic errors
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
    },
    meta: {
      timestamp: Date.now(),
    },
  };
  
  res.status(500).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: Date.now(),
    },
  };
  
  res.status(404).json(response);
}
