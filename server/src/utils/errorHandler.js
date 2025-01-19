import { ApiError } from './ApiError.js';

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