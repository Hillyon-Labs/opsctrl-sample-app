import { SetMetadata } from '@nestjs/common';

export interface AuditMetadata {
  action: string;
  resource: string;
  description?: string;
}

export const LOG_AUDIT_KEY = 'log_audit';

export const LogAudit = (metadata: AuditMetadata) =>
  SetMetadata(LOG_AUDIT_KEY, metadata);
