import type { RetryOptions, ErrorStats } from '../types/index.js';

/**
 * Enhanced Error Handler with retry logic and statistics
 */
class ErrorHandler {
  private errorStats: ErrorStats;

  constructor() {
    this.errorStats = {
      totalErrors: 0,
      errorTypes: {},
      mostFrequentErrors: []
    };
  }

  /**
   * Handle API errors with retry logic
   */
  async handleWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Log the error
        this.recordError(lastError, options.operation);
        
        if (attempt === options.maxRetries) {
          console.error(`❌ Operation failed after ${options.maxRetries + 1} attempts: ${lastError.message}`);
          throw lastError;
        }
        
        // Calculate delay with exponential backoff
        const delay = options.baseDelay * Math.pow(2, attempt);
        console.warn(`⚠️  Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`);
        
        await this.delay(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Handle API errors specifically
   */
  handleApiError(error: any, context: string = 'API call'): Error {
    let errorMessage = 'Unknown API error';
    let errorType = 'unknown';

    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const data = error.response.data;
      
      errorType = `http_${status}`;
      
      if (status === 401) {
        errorMessage = 'Authentication failed - check your Zendesk credentials';
      } else if (status === 403) {
        errorMessage = 'Access forbidden - insufficient permissions';
      } else if (status === 404) {
        errorMessage = 'Resource not found';
      } else if (status === 429) {
        errorMessage = 'Rate limit exceeded - too many requests';
      } else if (status >= 500) {
        errorMessage = 'Server error - please try again later';
      } else {
        errorMessage = data?.error?.message || data?.description || `HTTP ${status} error`;
      }
      
      console.error(`🌐 ${context} failed:`, {
        status,
        message: errorMessage,
        url: error.config?.url,
        method: error.config?.method
      });
      
    } else if (error.request) {
      // Network error
      errorType = 'network';
      errorMessage = 'Network error - please check your internet connection';
      console.error(`🔌 ${context} network error:`, error.message);
      
    } else {
      // Other error
      errorType = 'client';
      errorMessage = error.message || 'Unexpected error occurred';
      console.error(`⚠️  ${context} error:`, error.message);
    }

    const enhancedError = new Error(`${context}: ${errorMessage}`);
    this.recordError(enhancedError, context, errorType);
    
    return enhancedError;
  }

  /**
   * Handle validation errors
   */
  handleValidationError(field: string, value: any, expectedType: string): Error {
    const errorMessage = `Validation failed for ${field}: expected ${expectedType}, got ${typeof value}`;
    const error = new Error(errorMessage);
    
    this.recordError(error, 'validation', 'validation');
    console.error(`📋 Validation Error:`, { field, value, expectedType });
    
    return error;
  }

  /**
   * Handle configuration errors
   */
  handleConfigError(missingConfig: string): Error {
    const errorMessage = `Missing required configuration: ${missingConfig}`;
    const error = new Error(errorMessage);
    
    this.recordError(error, 'configuration', 'config');
    console.error(`⚙️  Configuration Error:`, { missingConfig });
    
    return error;
  }

  /**
   * Handle file system errors
   */
  handleFileError(operation: string, filePath: string, originalError: Error): Error {
    const errorMessage = `File ${operation} failed for ${filePath}: ${originalError.message}`;
    const error = new Error(errorMessage);
    
    this.recordError(error, 'file_system', 'file');
    console.error(`📁 File System Error:`, { operation, filePath, originalError: originalError.message });
    
    return error;
  }

  /**
   * Safe async operation wrapper
   */
  async safeAsync<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    context: string = 'async operation'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.warn(`⚠️  ${context} failed, using default value:`, (error as Error).message);
      this.recordError(error as Error, context, 'safe_async');
      return defaultValue;
    }
  }

  /**
   * Safe sync operation wrapper
   */
  safe<T>(
    operation: () => T,
    defaultValue: T,
    context: string = 'sync operation'
  ): T {
    try {
      return operation();
    } catch (error) {
      console.warn(`⚠️  ${context} failed, using default value:`, (error as Error).message);
      this.recordError(error as Error, context, 'safe_sync');
      return defaultValue;
    }
  }

  /**
   * Record error for statistics
   */
  private recordError(error: Error, operation: string, type: string = 'unknown'): void {
    this.errorStats.totalErrors++;

    // Track error types
    if (!this.errorStats.errorTypes[type]) {
      this.errorStats.errorTypes[type] = {
        count: 0,
        operations: {}
      };
    }
    
    this.errorStats.errorTypes[type].count++;
    
    if (!this.errorStats.errorTypes[type].operations[operation]) {
      this.errorStats.errorTypes[type].operations[operation] = 0;
    }
    this.errorStats.errorTypes[type].operations[operation]++;

    // Update most frequent errors
    this.updateMostFrequentErrors();
  }

  /**
   * Update most frequent errors list
   */
  private updateMostFrequentErrors(): void {
    this.errorStats.mostFrequentErrors = Object.entries(this.errorStats.errorTypes)
      .map(([type, stats]) => ({ type, count: stats.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    return { ...this.errorStats };
  }

  /**
   * Reset error statistics
   */
  resetStats(): void {
    this.errorStats = {
      totalErrors: 0,
      errorTypes: {},
      mostFrequentErrors: []
    };
  }

  /**
   * Check if should retry based on error type
   */
  shouldRetry(error: any): boolean {
    if (error.response) {
      const status = error.response.status;
      // Don't retry client errors (4xx) except rate limiting
      if (status >= 400 && status < 500 && status !== 429) {
        return false;
      }
      // Retry server errors (5xx) and rate limiting (429)
      return status >= 500 || status === 429;
    }
    
    // Retry network errors
    return true;
  }

  /**
   * Get retry delay based on error type
   */
  getRetryDelay(error: any, attempt: number, baseDelay: number): number {
    if (error.response?.status === 429) {
      // Rate limiting - use longer delay
      return baseDelay * Math.pow(2, attempt) + 1000;
    }
    
    // Standard exponential backoff
    return baseDelay * Math.pow(2, attempt);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format error for logging
   */
  formatError(error: Error, context?: string): string {
    let formatted = `Error: ${error.message}`;
    
    if (context) {
      formatted = `${context} - ${formatted}`;
    }
    
    if (error.stack) {
      formatted += `\nStack: ${error.stack}`;
    }
    
    return formatted;
  }
}

// Create default error handler instance
const defaultErrorHandler = new ErrorHandler();

export default defaultErrorHandler;
export { ErrorHandler };