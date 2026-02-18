import { AuditLog } from '../../domain/entities/audit-log';
import { AuditAction } from '../../domain/value-objects/audit-action';
import { AuditLogId } from '../../domain/value-objects/audit-log-id';
import { AuditResource } from '../../domain/value-objects/audit-resource';

export interface AuditLogFilters {
  action?: AuditAction;
  resource?: AuditResource;
  actorId?: string;
  from?: Date;
  to?: Date;
}

export interface AuditLogRepository {
  findById(id: AuditLogId): Promise<AuditLog | null>;
  list(filters: AuditLogFilters): Promise<AuditLog[]>;
  save(log: AuditLog): Promise<AuditLog>;
}
