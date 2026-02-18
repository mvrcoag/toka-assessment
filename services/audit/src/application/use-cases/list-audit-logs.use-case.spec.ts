import { ListAuditLogsUseCase } from './list-audit-logs.use-case';
import { AuditLog } from '../../domain/entities/audit-log';
import { AuditAction } from '../../domain/value-objects/audit-action';
import { AuditResource } from '../../domain/value-objects/audit-resource';

describe('ListAuditLogsUseCase', () => {
  it('passes filters to repository', async () => {
    const list = jest.fn(async () => [
      AuditLog.create({
        action: AuditAction.create('user.created'),
        resource: AuditResource.create('user'),
      }),
    ]);
    const useCase = new ListAuditLogsUseCase({
      list,
      findById: async () => null,
      save: async (log) => log,
    });

    const logs = await useCase.execute({
      action: 'user.created',
      resource: 'user',
      actorId: 'user-1',
      from: new Date('2024-01-01T00:00:00Z'),
      to: new Date('2024-01-02T00:00:00Z'),
    });

    expect(list).toHaveBeenCalled();
    expect(logs).toHaveLength(1);
  });
});
