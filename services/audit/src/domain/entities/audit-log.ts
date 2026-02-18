import { AuditAction } from '../value-objects/audit-action';
import { AuditLogId } from '../value-objects/audit-log-id';
import { AuditResource } from '../value-objects/audit-resource';

export interface AuditLogProps {
  id?: AuditLogId;
  action: AuditAction;
  resource: AuditResource;
  actorId?: string;
  actorRole?: string;
  metadata?: Record<string, unknown>;
  occurredAt: Date;
}

export class AuditLog {
  private readonly props: AuditLogProps;

  private constructor(props: AuditLogProps) {
    this.props = props;
  }

  static create(props: Omit<AuditLogProps, 'occurredAt'> & { occurredAt?: Date }): AuditLog {
    return new AuditLog({
      ...props,
      occurredAt: props.occurredAt ?? new Date(),
    });
  }

  static rehydrate(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }

  get id(): AuditLogId | undefined {
    return this.props.id;
  }

  get action(): AuditAction {
    return this.props.action;
  }

  get resource(): AuditResource {
    return this.props.resource;
  }

  get actorId(): string | undefined {
    return this.props.actorId;
  }

  get actorRole(): string | undefined {
    return this.props.actorRole;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }
}
