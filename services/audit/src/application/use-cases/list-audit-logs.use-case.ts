import { AuditAction } from '../../domain/value-objects/audit-action';
import { AuditResource } from '../../domain/value-objects/audit-resource';
import { AuditLogRepository } from '../ports/audit-log-repository';

export interface ListAuditLogsInput {
  action?: string;
  resource?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
}

export class ListAuditLogsUseCase {
  constructor(private readonly repository: AuditLogRepository) {}

  async execute(input: ListAuditLogsInput) {
    return this.repository.list({
      action: input.action ? AuditAction.create(input.action) : undefined,
      resource: input.resource ? AuditResource.create(input.resource) : undefined,
      actorId: input.actorId,
      from: input.from,
      to: input.to,
    });
  }
}
