import { LogLevel } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import chalk from 'chalk';

export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableJson: boolean;
  logDirectory: string;
  maxFiles: string;
  maxSize: string;
  datePattern: string;
  enableRequestLogging: boolean;
  enablePerformanceLogging: boolean;
  enableAuditLogging: boolean;
  sensitiveFields: string[];
  correlationIdHeader: string;
}

export const loggingConfig = (): LoggingConfig => ({
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
  enableFile: process.env.LOG_ENABLE_FILE === 'true',
  enableJson: process.env.LOG_ENABLE_JSON === 'true',
  logDirectory: process.env.LOG_DIRECTORY || './logs',
  maxFiles: process.env.LOG_MAX_FILES || '30d',
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
  enableRequestLogging: process.env.LOG_ENABLE_REQUESTS !== 'false',
  enablePerformanceLogging: process.env.LOG_ENABLE_PERFORMANCE === 'true',
  enableAuditLogging: process.env.LOG_ENABLE_AUDIT === 'true',
  sensitiveFields: (
    process.env.LOG_SENSITIVE_FIELDS ||
    'password,token,secret,key,authorization,cookie'
  ).split(','),
  correlationIdHeader: process.env.LOG_CORRELATION_HEADER || 'x-correlation-id',
});

// Log level symbols and colors
const LOG_SYMBOLS = {
  error: '❌',
  warn: '⚠️ ',
  info: 'ℹ️ ',
  debug: '🔍',
  verbose: '📝',
};

const LOG_COLORS = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.green,
  debug: chalk.blue,
  verbose: chalk.gray,
};

// Filter out noisy startup logs
const shouldFilterLog = (message: string, context?: string): boolean => {
  const noisyPatterns = [
    /dependencies initialized$/,
    /Mapped \{.*\} route$/,
    /InstanceLoader.*dependencies initialized$/,
    /RouterExplorer.*Mapped/,
  ];

  return noisyPatterns.some((pattern) => pattern.test(message));
};

// Create filter format
const createFilterFormat = () => {
  return winston.format((info: any) => {
    if (shouldFilterLog(String(info.message), String(info.context))) {
      return false;
    }
    return info;
  })();
};

// Create beautiful development format
const createDevFormat = () => {
  return winston.format.printf(
    ({
      timestamp,
      level,
      message,
      context,
      correlationId,
      type,
      ...meta
    }: any) => {
      const time = chalk.gray(
        String(timestamp).split(' ')[1] || String(timestamp),
      ); // Only show time, not date
      const symbol = LOG_SYMBOLS[level] || '';
      const colorFn = LOG_COLORS[level] || chalk.white;

      // Handle different log types with special formatting
      if (type === 'request') {
        const method = chalk.bold(String(meta.method || ''));
        const url = chalk.cyan(String(meta.url || ''));
        const statusCode = Number(meta.statusCode) || 0;
        const status =
          statusCode >= 400 ? chalk.red(statusCode) : chalk.green(statusCode);
        const responseTime = chalk.yellow(`${meta.responseTime || 0}ms`);
        return `${time} 🌐 ${method} ${url} ${status} ${responseTime}`;
      }

      if (type === 'audit') {
        const action = chalk.magenta(String(meta.action || ''));
        const resource = chalk.cyan(String(meta.resource || ''));
        return `${time} 📋 ${action} ${resource}`;
      }

      if (type === 'performance') {
        const operation = chalk.blue(String(meta.operation || ''));
        const durationMs = Number(meta.duration) || 0;
        const duration =
          durationMs > 1000
            ? chalk.red(`${durationMs}ms`)
            : chalk.green(`${durationMs}ms`);
        const success = meta.success ? '✅' : '❌';
        return `${time} ⚡ ${operation} ${duration} ${success}`;
      }

      if (type === 'authentication') {
        const action = chalk.magenta(String(meta.action || ''));
        const userId = meta.userId
          ? chalk.blue(`[${String(meta.userId)}]`)
          : '';
        return `${time} 🔐 ${action} ${userId}`;
      }

      // Default format
      const contextStr = context ? chalk.gray(`[${String(context)}]`) : '';
      const correlationStr = correlationId
        ? chalk.gray(`[${String(correlationId).substring(0, 8)}]`)
        : '';

      // Clean up meta by removing common fields
      const cleanMeta = { ...meta };
      delete cleanMeta.service;
      delete cleanMeta.version;
      delete cleanMeta.environment;
      delete cleanMeta.pid;
      delete cleanMeta.timestamp;

      const metaStr =
        Object.keys(cleanMeta).length > 0 && level === 'debug'
          ? chalk.gray(` ${JSON.stringify(cleanMeta, null, 0)}`)
          : '';

      return `${time} ${symbol} ${colorFn(message)} ${contextStr}${correlationStr}${metaStr}`;
    },
  );
};

export const createWinstonConfig = (
  config: LoggingConfig,
): winston.LoggerOptions => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const formats: winston.Logform.Format[] = [
    winston.format.timestamp({
      format: isDevelopment
        ? 'YYYY-MM-DD HH:mm:ss.SSS'
        : 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    winston.format.errors({ stack: true }),
  ];

  // Add filter for development
  if (isDevelopment) {
    formats.unshift(createFilterFormat());
  }

  if (config.enableJson || !isDevelopment) {
    formats.push(winston.format.json());
  } else {
    formats.push(createDevFormat());
  }

  const transports: winston.transport[] = [];

  if (config.enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(...formats),
      }),
    );
  }

  if (config.enableFile) {
    // Error logs
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: `${config.logDirectory}/error-%DATE%.log`,
        datePattern: config.datePattern,
        level: 'error',
        maxFiles: config.maxFiles,
        maxSize: config.maxSize,
        format: winston.format.combine(...formats),
      }),
    );

    // Combined logs
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: `${config.logDirectory}/combined-%DATE%.log`,
        datePattern: config.datePattern,
        maxFiles: config.maxFiles,
        maxSize: config.maxSize,
        format: winston.format.combine(...formats),
      }),
    );

    // Audit logs if enabled
    if (config.enableAuditLogging) {
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: `${config.logDirectory}/audit-%DATE%.log`,
          datePattern: config.datePattern,
          maxFiles: config.maxFiles,
          maxSize: config.maxSize,
          format: winston.format.combine(...formats),
          level: 'info',
        }),
      );
    }
  }

  return {
    level: config.level,
    transports,
    defaultMeta: {
      service: 'nestjs-backend-template',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    exitOnError: false,
  };
};
