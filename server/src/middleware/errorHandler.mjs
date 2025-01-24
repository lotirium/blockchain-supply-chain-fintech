/**
 * Global error handler middleware for consistent error responses
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists'
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Related resource not found'
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle blockchain-specific errors
  if (err.message.includes('insufficient funds')) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient blockchain funds for operation'
    });
  }

  if (err.message.includes('nonce too low')) {
    return res.status(409).json({
      success: false,
      message: 'Transaction conflict. Please try again.'
    });
  }

  // Handle rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: err.retryAfter || 60
    });
  }

  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file upload'
    });
  }

  // Log unexpected errors to monitoring service
  if (process.env.NODE_ENV === 'production' && err.status !== 404) {
    // TODO: Add proper error monitoring service integration
    console.error('Unexpected error:', err);
  }

  // Default error response
  const statusCode = err.status || 500;
  const message = statusCode === 500 
    ? 'Internal server error'
    : err.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: {
        name: err.name,
        stack: err.stack
      }
    })
  });
};

/**
 * Custom error classes for specific error types
 */
export class ValidationError extends Error {
  constructor(errors) {
    super('Validation error');
    this.name = 'ValidationError';
    this.errors = errors;
    this.status = 400;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

export class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.status = 409;
  }
}

export default {
  errorHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
};