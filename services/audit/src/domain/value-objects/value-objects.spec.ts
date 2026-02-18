import { DomainError } from '../errors/domain-error';
import { AuditAction } from './audit-action';
import { AuditLogId } from './audit-log-id';
import { AuditResource } from './audit-resource';

describe('Audit value objects', () => {
  it('creates action and resource', () => {
    const action = AuditAction.create('user.created');
    const resource = AuditResource.create('user');
    expect(action.value).toBe('user.created');
    expect(resource.value).toBe('user');
  });

  it('validates required values', () => {
    expect(() => AuditAction.create('')).toThrow(DomainError);
    expect(() => AuditResource.create('')).toThrow(DomainError);
    expect(() => AuditLogId.create('')).toThrow(DomainError);
  });

  it('creates log id', () => {
    const id = AuditLogId.create('507f1f77bcf86cd799439011');
    expect(id.value).toBe('507f1f77bcf86cd799439011');
  });
});
