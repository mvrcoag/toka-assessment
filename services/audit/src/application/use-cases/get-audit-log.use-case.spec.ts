import { GetAuditLogUseCase } from './get-audit-log.use-case';
import { ApplicationError } from '../errors/application-error';
import { AuditLog } from '../../domain/entities/audit-log';
import { AuditAction } from '../../domain/value-objects/audit-action';
import { AuditResource } from '../../domain/value-objects/audit-resource';

describe('GetAuditLogUseCase', () => {
  it('returns audit log when found', async () => {
    const log = AuditLog.create({
      action: AuditAction.create('user.created'),
      resource: AuditResource.create('user'),
    });
    const useCase = new GetAuditLogUseCase({
      findById: async () => log,
      list: async () => [],
      save: async () => log,
    });

    const result = await useCase.execute('507f1f77bcf86cd799439011');
    expect(result.action.value).toBe('user.created');
  });

  it('throws when not found', async () => {
    const useCase = new GetAuditLogUseCase({
      findById: async () => null,
      list: async () => [],
      save: async (log) => log,
    });

    await expect(useCase.execute('507f1f77bcf86cd799439011')).rejects.toBeInstanceOf(
      ApplicationError,
    );
  });
});
