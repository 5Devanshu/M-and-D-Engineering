/**
 * BMS Integration Error Handler
 * Provides enhanced error handling for BMS operations
 */

class BMSError extends Error {
  constructor(message, statusCode = 500, originalError = null) {
    super(message);
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.timestamp = new Date();
  }
}

class BMSConnectionError extends BMSError {
  constructor(message, originalError) {
    super(message, 503, originalError);
    this.name = 'BMSConnectionError';
  }
}

class BMSValidationError extends BMSError {
  constructor(message) {
    super(message, 400);
    this.name = 'BMSValidationError';
  }
}

class BMSAuthenticationError extends BMSError {
  constructor(message) {
    super(message, 401);
    this.name = 'BMSAuthenticationError';
  }
}

class BMSNotFoundError extends BMSError {
  constructor(message) {
    super(message, 404);
    this.name = 'BMSNotFoundError';
  }
}

class BMSTimeoutError extends BMSError {
  constructor(message) {
    super(message, 504);
    this.name = 'BMSTimeoutError';
  }
}

/**
 * Error Response Formatter
 */
const formatBMSError = (error, logger) => {
  let bmsError = error;

  if (error.code === 'ECONNREFUSED') {
    bmsError = new BMSConnectionError(
      'BMS API is unreachable. Please check BMS_API_URL configuration.',
      error
    );
  } else if (error.code === 'ENOTFOUND') {
    bmsError = new BMSConnectionError(
      'BMS API hostname not found. Please verify BMS_API_URL.',
      error
    );
  } else if (error.code === 'ETIMEDOUT') {
    bmsError = new BMSTimeoutError(
      'BMS API request timed out. Please try again later.',
      error
    );
  } else if (error.response) {
    const { status, data } = error.response;
    
    if (status === 401) {
      bmsError = new BMSAuthenticationError(
        'BMS API Key is invalid or expired. Please check BMS_API_KEY.'
      );
    } else if (status === 404) {
      bmsError = new BMSNotFoundError(
        data?.message || 'Resource not found in BMS'
      );
    } else if (status === 400) {
      bmsError = new BMSValidationError(
        data?.message || 'Invalid data sent to BMS'
      );
    } else if (status >= 500) {
      bmsError = new BMSConnectionError(
        `BMS API error: ${data?.message || 'Internal server error'}`
      );
    }
  }

  if (logger) {
    logger.error('BMS Error', {
      name: bmsError.name,
      message: bmsError.message,
      statusCode: bmsError.statusCode,
      timestamp: bmsError.timestamp,
    });
  }

  return bmsError;
};

/**
 * Retry logic for failed operations
 */
const retryBMSOperation = async (operation, maxRetries = 3, delayMs = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Only retry on connection errors and timeouts
        if (
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENOTFOUND'
        ) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve =>
            setTimeout(resolve, delayMs * Math.pow(2, attempt - 1))
          );
        } else {
          // Don't retry on other errors
          throw error;
        }
      }
    }
  }

  throw lastError;
};

module.exports = {
  BMSError,
  BMSConnectionError,
  BMSValidationError,
  BMSAuthenticationError,
  BMSNotFoundError,
  BMSTimeoutError,
  formatBMSError,
  retryBMSOperation,
};
