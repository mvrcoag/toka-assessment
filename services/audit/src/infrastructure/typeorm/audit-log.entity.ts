import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('audit_logs')
export class AuditLogEntity {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column()
  action!: string;

  @Column()
  resource!: string;

  @Column({ nullable: true })
  actorId?: string;

  @Column({ nullable: true })
  actorRole?: string;

  @Column({ nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'occurred_at' })
  occurredAt!: Date;
}
