import { AuditLogId } from '../../domain/value-objects/audit-log-id';
import { ApplicationError } from '../errors/application-error';
import { AuditLogRepository } from '../ports/audit-log-repository';

export class GetAuditLogUseCase {
  constructor(private readonly repository: AuditLogRepository) {}

  async execute(id: string) {
    const logId = AuditLogId.create(id);
    const log = await this.repository.findById(logId);
    if (!log) {
      throw new ApplicationError('Audit log not found', 404);
    }

    return log;
  }
}
