import { AuditLogController } from './audit-log.controller';
import { AuditLog } from '../../domain/entities/audit-log';
import { AuditAction } from '../../domain/value-objects/audit-action';
import { AuditResource } from '../../domain/value-objects/audit-resource';
import { ApplicationError } from '../../application/errors/application-error';

describe('AuditLogController', () => {
  const log = AuditLog.create({
    action: AuditAction.create('user.created'),
    resource: AuditResource.create('user'),
  });

  it('lists logs with filters', async () => {
    const controller = new AuditLogController(
      { execute: async () => log } as any,
      { execute: async () => [log] } as any,
    );

    const logs = await controller.list({
      action: 'user.created',
      resource: 'user',
      actorId: 'user-1',
      from: '2024-01-01T00:00:00Z',
      to: '2024-01-02T00:00:00Z',
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('user.created');
  });

  it('throws on invalid date filter', async () => {
    const controller = new AuditLogController(
      { execute: async () => log } as any,
      { execute: async () => [log] } as any,
    );

    await expect(
      controller.list({
        from: 'invalid',
      } as any),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it('gets a log by id', async () => {
    const controller = new AuditLogController(
      { execute: async () => log } as any,
      { execute: async () => [] } as any,
    );

    const result = await controller.get('507f1f77bcf86cd799439011');
    expect(result.resource).toBe('user');
  });
});
