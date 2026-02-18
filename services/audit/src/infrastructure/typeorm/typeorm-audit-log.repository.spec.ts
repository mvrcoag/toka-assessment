import { ObjectId } from 'mongodb';
import { MongoRepository } from 'typeorm';
import { TypeOrmAuditLogRepository } from './typeorm-audit-log.repository';
import { AuditLogEntity } from './audit-log.entity';
import { AuditLog } from '../../domain/entities/audit-log';
import { AuditAction } from '../../domain/value-objects/audit-action';
import { AuditResource } from '../../domain/value-objects/audit-resource';
import { AuditLogId } from '../../domain/value-objects/audit-log-id';

describe('TypeOrmAuditLogRepository', () => {
  const buildRepo = (entity?: AuditLogEntity) => {
    const repository = {
      findOne: jest.fn(async () => entity ?? null),
      find: jest.fn(async () => (entity ? [entity] : [])),
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => ({
        ...input,
        _id: entity?._id ?? new ObjectId('507f1f77bcf86cd799439011'),
      })),
    } as unknown as MongoRepository<AuditLogEntity>;

    return { repository, sut: new TypeOrmAuditLogRepository(repository) };
  };

  it('maps entity to domain', async () => {
    const entity = {
      _id: new ObjectId('507f1f77bcf86cd799439011'),
      action: 'user.created',
      resource: 'user',
      actorId: 'user-1',
      actorRole: 'admin',
      metadata: { field: 'name' },
      occurredAt: new Date('2024-01-01T00:00:00Z'),
    } as AuditLogEntity;
    const { sut } = buildRepo(entity);

    const log = await sut.findById(AuditLogId.create(entity._id.toHexString()));
    expect(log?.action.value).toBe('user.created');
    expect(log?.actorRole).toBe('admin');
  });

  it('returns null when id is invalid', async () => {
    const { sut } = buildRepo();
    const result = await sut.findById(
      AuditLogId.create('invalid-id'),
    );
    expect(result).toBeNull();
  });

  it('lists logs with filters', async () => {
    const entity = {
      _id: new ObjectId('507f1f77bcf86cd799439011'),
      action: 'user.created',
      resource: 'user',
      occurredAt: new Date('2024-01-01T00:00:00Z'),
    } as AuditLogEntity;
    const { sut, repository } = buildRepo(entity);

    const logs = await sut.list({
      action: AuditAction.create('user.created'),
      resource: AuditResource.create('user'),
      actorId: 'user-1',
      from: new Date('2024-01-01T00:00:00Z'),
      to: new Date('2024-01-02T00:00:00Z'),
    });

    expect(repository.find).toHaveBeenCalled();
    expect(logs).toHaveLength(1);
  });

  it('saves audit log and returns domain', async () => {
    const { sut, repository } = buildRepo();
    const log = AuditLog.create({
      action: AuditAction.create('user.created'),
      resource: AuditResource.create('user'),
      actorId: 'user-1',
      actorRole: 'admin',
      metadata: { name: 'Toka' },
    });

    const saved = await sut.save(log);
    expect(repository.save).toHaveBeenCalled();
    expect(saved.action.value).toBe('user.created');
  });
});
