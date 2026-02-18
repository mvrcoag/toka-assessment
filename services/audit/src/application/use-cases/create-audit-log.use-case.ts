import { AuditLog } from '../../domain/entities/audit-log';
import { AuditAction } from '../../domain/value-objects/audit-action';
import { AuditResource } from '../../domain/value-objects/audit-resource';
import { ApplicationError } from '../errors/application-error';
import { AuditLogRepository } from '../ports/audit-log-repository';

export interface CreateAuditLogInput {
  action: string;
  resource: string;
  actorId?: string;
  actorRole?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}

export class CreateAuditLogUseCase {
  constructor(private readonly repository: AuditLogRepository) {}

  async execute(input: CreateAuditLogInput): Promise<AuditLog> {
    if (!input.action || !input.resource) {
      throw new ApplicationError('Action and resource are required', 400);
    }

    const log = AuditLog.create({
      action: AuditAction.create(input.action),
      resource: AuditResource.create(input.resource),
      actorId: input.actorId,
      actorRole: input.actorRole,
      metadata: input.metadata,
      occurredAt: input.occurredAt,
    });

    return this.repository.save(log);
  }
}
