import { SetMetadata } from '@nestjs/common';

export interface PerformanceMetadata {
  operation: string;
  threshold?: number; // Log if operation takes longer than this (ms)
  alwaysLog?: boolean;
}

export const LOG_PERFORMANCE_KEY = 'log_performance';

export const LogPerformance = (metadata: PerformanceMetadata) =>
  SetMetadata(LOG_PERFORMANCE_KEY, metadata);
