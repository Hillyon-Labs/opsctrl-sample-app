import { LogLevel } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

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

// Log level symbols
const LOG_SYMBOLS: Record<string, string> = {
  error: '❌',
  warn: '⚠️ ',
  info: 'ℹ️ ',
  debug: '🔍',
  verbose: '📝',
};

const identity = (s: unknown) => String(s);
const LOG_COLORS: Record<string, (s: unknown) => string> = {
  error: identity,
  warn: identity,
  info: identity,
  debug: identity,
  verbose: identity,
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

// Create development format (plain text, no colors)
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
      const time = String(timestamp).split(' ')[1] || String(timestamp);
      const symbol = LOG_SYMBOLS[level] || '';
      const colorFn = LOG_COLORS[level] || identity;

      if (type === 'request') {
        const statusCode = Number(meta.statusCode) || 0;
        return `${time} 🌐 ${meta.method || ''} ${meta.url || ''} ${statusCode} ${meta.responseTime || 0}ms`;
      }

      if (type === 'audit') {
        return `${time} 📋 ${meta.action || ''} ${meta.resource || ''}`;
      }

      if (type === 'performance') {
        const success = meta.success ? '✅' : '❌';
        return `${time} ⚡ ${meta.operation || ''} ${meta.duration || 0}ms ${success}`;
      }

      if (type === 'authentication') {
        const userId = meta.userId ? `[${String(meta.userId)}]` : '';
        return `${time} 🔐 ${meta.action || ''} ${userId}`;
      }

      const contextStr = context ? `[${String(context)}]` : '';
      const correlationStr = correlationId ? `[${String(correlationId).substring(0, 8)}]` : '';

      const cleanMeta = { ...meta };
      delete cleanMeta.service;
      delete cleanMeta.version;
      delete cleanMeta.environment;
      delete cleanMeta.pid;
      delete cleanMeta.timestamp;

      const metaStr =
        Object.keys(cleanMeta).length > 0 && level === 'debug'
          ? ` ${JSON.stringify(cleanMeta, null, 0)}`
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
