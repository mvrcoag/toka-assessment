import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { AuditLogRepository, AuditLogFilters } from '../../application/ports/audit-log-repository';
import { AuditLog } from '../../domain/entities/audit-log';
import { AuditAction } from '../../domain/value-objects/audit-action';
import { AuditLogId } from '../../domain/value-objects/audit-log-id';
import { AuditResource } from '../../domain/value-objects/audit-resource';
import { AuditLogEntity } from './audit-log.entity';

@Injectable()
export class TypeOrmAuditLogRepository implements AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: MongoRepository<AuditLogEntity>,
  ) {}

  async findById(id: AuditLogId): Promise<AuditLog | null> {
    const objectId = this.toObjectId(id.value);
    if (!objectId) {
      return null;
    }

    const entity = await this.repository.findOne({ where: { _id: objectId } });
    return entity ? this.toDomain(entity) : null;
  }

  async list(filters: AuditLogFilters): Promise<AuditLog[]> {
    const where: Record<string, unknown> = {};
    if (filters.action) {
      where.action = filters.action.value;
    }
    if (filters.resource) {
      where.resource = filters.resource.value;
    }
    if (filters.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters.from || filters.to) {
      where.occurredAt = {
        ...(filters.from ? { $gte: filters.from } : {}),
        ...(filters.to ? { $lte: filters.to } : {}),
      };
    }

    const entities = await this.repository.find({
      where,
      order: { occurredAt: 'DESC' },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async save(log: AuditLog): Promise<AuditLog> {
    const entity = this.repository.create({
      _id: log.id ? this.toObjectId(log.id.value) ?? undefined : undefined,
      action: log.action.value,
      resource: log.resource.value,
      actorId: log.actorId,
      actorRole: log.actorRole,
      metadata: log.metadata,
      occurredAt: log.occurredAt,
    });

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: AuditLogEntity): AuditLog {
    const occurredAt = entity.occurredAt ? new Date(entity.occurredAt) : new Date(Number.NaN);
    return AuditLog.rehydrate({
      id: AuditLogId.create(entity._id.toHexString()),
      action: AuditAction.create(entity.action),
      resource: AuditResource.create(entity.resource),
      actorId: entity.actorId,
      actorRole: entity.actorRole,
      metadata: entity.metadata,
      occurredAt,
    });
  }

  private toObjectId(value: string): ObjectId | null {
    try {
      return new ObjectId(value);
    } catch {
      return null;
    }
  }
}
