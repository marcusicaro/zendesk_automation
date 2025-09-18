import winston from 'winston';
import type { LogContext, LoggerChild, TicketAnalysis, TaggingResult } from '../types/index.js';

/**
 * Logger utility using Winston
 * Provides structured logging for the ticket automation system
 */
class Logger {
  private logger: winston.Logger;

  constructor(level: string = 'info') {
    this.logger = winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize({ all: true }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          let logString = `${timestamp} [${level}] ${message}`;
          if (Object.keys(meta).length > 0) {
            logString += ` ${JSON.stringify(meta, null, 2)}`;
          }
          return logString;
        })
      ),
      transports: [
        new winston.transports.Console({
          handleExceptions: true,
          handleRejections: true
        }),
        new winston.transports.File({
          filename: 'logs/automation.log',
          handleExceptions: true,
          handleRejections: true,
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ],
      exitOnError: false
    });

    // Create logs directory if it doesn't exist
    this.ensureLogDirectory();
  }

  /**
   * Create a child logger with context
   */
  child(context: LogContext): LoggerChild {
    const childLogger = this.logger.child(context);

    return {
      info: (message: string, meta?: LogContext) => {
        childLogger.info(message, meta);
      },

      error: (message: string, error?: Error | LogContext) => {
        if (error instanceof Error) {
          childLogger.error(message, { error: error.message, stack: error.stack });
        } else {
          childLogger.error(message, error);
        }
      },

      warn: (message: string, meta?: LogContext) => {
        childLogger.warn(message, meta);
      },

      debug: (message: string, meta?: LogContext) => {
        childLogger.debug(message, meta);
      },

      logAutomationEvent: (event: string, data?: LogContext) => {
        childLogger.info(`[AUTOMATION] ${event}`, {
          event,
          timestamp: new Date().toISOString(),
          ...data
        });
      },

      logTicketAction: (action: string, ticketId: number, data?: LogContext) => {
        childLogger.info(`[TICKET] ${action}`, {
          action,
          ticketId,
          timestamp: new Date().toISOString(),
          ...data
        });
      },

      logApiRequest: (method: string, endpoint: string, statusCode: number, duration: number, meta?: LogContext) => {
        const level = statusCode >= 400 ? 'error' : 'debug';
        childLogger.log(level, `[API] ${method} ${endpoint}`, {
          method,
          endpoint,
          statusCode,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
          ...meta
        });
      },

      logAnalysis: (analysis: TicketAnalysis) => {
        childLogger.info(`[ANALYSIS] Ticket ${analysis.ticketId}`, {
          ticketId: analysis.ticketId,
          confidence: analysis.confidence,
          categories: analysis.categories.length,
          suggestedTags: analysis.suggestedTags.length,
          priority: analysis.priority.level,
          sentiment: analysis.sentiment.sentiment,
          timestamp: new Date().toISOString()
        });
      },

      logTagging: (taggingResult: TaggingResult) => {
        const level = taggingResult.status === 'error' ? 'error' : 'info';
        childLogger.log(level, `[TAGGING] Ticket ${taggingResult.ticketId}`, {
          ticketId: taggingResult.ticketId,
          status: taggingResult.status,
          confidence: taggingResult.confidence,
          tags: taggingResult.tags?.length || 0,
          error: taggingResult.error,
          timestamp: new Date().toISOString()
        });
      },

      logBatchSummary: (operation: string, summary: any) => {
        childLogger.info(`[BATCH] ${operation} Summary`, {
          operation,
          summary,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Log info message
   */
  info(message: string, meta?: LogContext): void {
    this.logger.info(message, meta);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | LogContext): void {
    if (error instanceof Error) {
      this.logger.error(message, { error: error.message, stack: error.stack });
    } else {
      this.logger.error(message, error);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: LogContext): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: LogContext): void {
    this.logger.debug(message, meta);
  }

  /**
   * Set log level
   */
  setLevel(level: string): void {
    this.logger.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): string {
    return this.logger.level;
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    import('fs').then(fs => {
      if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs', { recursive: true });
      }
    }).catch(() => {
      // Silently fail if can't create directory
    });
  }

  /**
   * Close logger and flush all transports
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.end(() => {
        resolve();
      });
    });
  }
}

// Create default logger instance
const defaultLogger = new Logger(process.env.LOG_LEVEL || 'info');

export default defaultLogger;
export { Logger };