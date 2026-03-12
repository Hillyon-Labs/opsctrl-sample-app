import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';
import * as winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';
import {
  createWinstonConfig,
  loggingConfig,
  LoggingConfig,
} from '../../config/logging.config';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  organizationId?: string;
  clusterId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  [key: string]: any;
}

export interface AuditLogData {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  organizationId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PerformanceLogData {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

@Injectable({ scope: Scope.DEFAULT })
export class LoggerService implements NestLoggerService {
  private readonly winston: winston.Logger;
  private readonly config: LoggingConfig;
  private readonly contextStorage = new AsyncLocalStorage<LogContext>();

  constructor() {
    this.config = loggingConfig();
    this.winston = winston.createLogger(createWinstonConfig(this.config));
  }

  /**
   * Set context for the current async operation
   */
  setContext(context: LogContext): void {
    const existingContext = this.contextStorage.getStore() || {};
    this.contextStorage.enterWith({ ...existingContext, ...context });
  }

  /**
   * Run function with logging context
   */
  withContext<T>(context: LogContext, fn: () => T): T {
    const existingContext = this.contextStorage.getStore() || {};
    return this.contextStorage.run({ ...existingContext, ...context }, fn);
  }

  /**
   * Get current logging context
   */
  getContext(): LogContext {
    return this.contextStorage.getStore() || {};
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    const sanitized = { ...data };
    for (const field of this.config.sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Build log metadata with context
   */
  private buildLogMeta(
    message: string,
    context?: string,
    meta?: Record<string, any>,
  ): Record<string, any> {
    const currentContext = this.getContext();
    return {
      ...this.sanitize(meta || {}),
      context,
      ...currentContext,
      pid: process.pid,
      timestamp: new Date().toISOString(),
    };
  }

  // Standard logging methods
  log(message: string, context?: string, meta?: Record<string, any>): void {
    this.winston.info(message, this.buildLogMeta(message, context, meta));
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    meta?: Record<string, any>,
  ): void {
    this.winston.error(message, {
      ...this.buildLogMeta(message, context, meta),
      stack: trace,
    });
  }

  warn(message: string, context?: string, meta?: Record<string, any>): void {
    this.winston.warn(message, this.buildLogMeta(message, context, meta));
  }

  debug(message: string, context?: string, meta?: Record<string, any>): void {
    this.winston.debug(message, this.buildLogMeta(message, context, meta));
  }

  verbose(message: string, context?: string, meta?: Record<string, any>): void {
    this.winston.verbose(message, this.buildLogMeta(message, context, meta));
  }

  // Enhanced logging methods
  info(message: string, context?: string, meta?: Record<string, any>): void {
    this.log(message, context, meta);
  }

  fatal(
    message: string,
    trace?: string,
    context?: string,
    meta?: Record<string, any>,
  ): void {
    this.winston.error(message, {
      ...this.buildLogMeta(message, context, meta),
      level: 'fatal',
      stack: trace,
    });
  }

  /**
   * Log HTTP requests
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userAgent?: string,
    ip?: string,
    userId?: string,
  ): void {
    if (!this.config.enableRequestLogging) return;

    this.winston.info('HTTP Request', {
      type: 'request',
      method,
      url,
      statusCode,
      responseTime,
      userAgent,
      ip,
      userId,
      ...this.getContext(),
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(data: PerformanceLogData): void {
    if (!this.config.enablePerformanceLogging) return;

    this.winston.info('Performance Metric', {
      type: 'performance',
      ...data,
      ...this.getContext(),
    });
  }

  /**
   * Log audit events
   */
  logAudit(data: AuditLogData): void {
    if (!this.config.enableAuditLogging) return;

    this.winston.info('Audit Event', {
      type: 'audit',
      ...data,
      ...this.getContext(),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log database operations
   */
  logDatabase(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    error?: string,
  ): void {
    this.winston.debug('Database Operation', {
      type: 'database',
      operation,
      table,
      duration,
      success,
      error,
      ...this.getContext(),
    });
  }

  /**
   * Log external API calls
   */
  logExternalCall(
    service: string,
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    success: boolean,
  ): void {
    this.winston.info('External API Call', {
      type: 'external_call',
      service,
      method,
      url,
      statusCode,
      duration,
      success,
      ...this.getContext(),
    });
  }

  /**
   * Log authentication events
   */
  logAuth(
    action: 'login' | 'logout' | 'token_refresh' | 'failed_login',
    userId?: string,
    metadata?: Record<string, any>,
  ): void {
    this.winston.info('Authentication Event', {
      type: 'authentication',
      action,
      userId,
      ...this.sanitize(metadata || {}),
      ...this.getContext(),
    });
  }

  /**
   * Log security events
   */
  logSecurity(
    event:
      | 'unauthorized_access'
      | 'suspicious_activity'
      | 'rate_limit'
      | 'validation_error',
    details: Record<string, any>,
  ): void {
    this.winston.warn('Security Event', {
      type: 'security',
      event,
      ...this.sanitize(details),
      ...this.getContext(),
    });
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): LoggerService {
    const childLogger = new LoggerService();
    childLogger.setContext({ ...this.getContext(), ...context });
    return childLogger;
  }

  /**
   * Measure operation performance
   */
  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const start = Date.now();
    let success = true;
    let error: Error | undefined;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      success = false;
      error = err as Error;
      throw err;
    } finally {
      const duration = Date.now() - start;
      this.logPerformance({
        operation,
        duration,
        success,
        metadata: {
          ...metadata,
          error: error?.message,
        },
      });
    }
  }
}
