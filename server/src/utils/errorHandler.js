import { ApiError } from './ApiError.js';
import * as Sentry from "@sentry/node";

/**
 * Wraps an async route handler to catch errors and pass them to Express error handler
 * @param {Function} fn The async route handler function
 * @returns {Function} Wrapped route handler that catches errors
 */
export const handleAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error('Error:', err);
      
      if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
          status: err.status,
          message: err.message
        });
      }

      // Default to 500 server error for unhandled errors
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    });
  };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } 
  // Production error response
  else {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Programming or other unknown error: don't leak error details
    else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
      });
    }
  }
};

// Custom error classes
export class SchedulingError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'SchedulingError';
    this.context = context;
  }
}

export class ValidationError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'ValidationError';
    this.context = context;
  }
}

export class DatabaseError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'DatabaseError';
    this.context = context;
  }
}

// Error categories for better organization
export const ErrorCategory = {
  SCHEDULING: 'scheduling',
  DATABASE: 'database',
  VALIDATION: 'validation',
  SYSTEM: 'system'
};

// Main error handler function
export const handleError = (error, category, context = {}) => {
  // Enrich context with additional info
  const enrichedContext = {
    ...context,
    timestamp: new Date().toISOString(),
    category,
    environment: process.env.NODE_ENV || 'development'
  };

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      context: enrichedContext
    });
  }

  // Report to Sentry
  Sentry.withScope(scope => {
    scope.setExtra('context', enrichedContext);
    scope.setTag('category', category);
    scope.setLevel(error.level || 'error');
    Sentry.captureException(error);
  });

  return error;
};

// Retry mechanism for async operations
export const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Log retry attempt
      Sentry.addBreadcrumb({
        category: 'retry',
        message: `Retry attempt ${attempt} of ${maxRetries}`,
        level: 'info'
      });

      if (attempt === maxRetries) break;
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

// Wrapper for async route handlers
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    handleError(error, ErrorCategory.SYSTEM, {
      path: req.path,
      method: req.method,
      userId: req.user?._id
    });
    next(error);
  });
}; 