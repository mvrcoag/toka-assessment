import { AuditLog } from './audit-log';
import { AuditAction } from '../value-objects/audit-action';
import { AuditResource } from '../value-objects/audit-resource';

describe('AuditLog', () => {
  it('creates with default occurredAt', () => {
    const log = AuditLog.create({
      action: AuditAction.create('user.created'),
      resource: AuditResource.create('user'),
    });
    expect(log.occurredAt).toBeInstanceOf(Date);
  });

  it('rehydrates persisted log', () => {
    const occurredAt = new Date('2024-01-01T00:00:00Z');
    const log = AuditLog.rehydrate({
      action: AuditAction.create('user.updated'),
      resource: AuditResource.create('user'),
      actorId: 'user-1',
      actorRole: 'admin',
      metadata: { field: 'name' },
      occurredAt,
    });
    expect(log.actorId).toBe('user-1');
    expect(log.metadata?.field).toBe('name');
    expect(log.occurredAt).toBe(occurredAt);
  });
});
