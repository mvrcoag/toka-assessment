import { DomainEvent } from './domain-event';

export class RoleUpdatedEvent implements DomainEvent {
  readonly name = 'RoleUpdated';
  readonly occurredAt: Date;
  readonly roleId: string;
  readonly roleName: string;
  actorId?: string;
  actorRole?: string;

  constructor(roleId: string, roleName: string, occurredAt: Date = new Date()) {
    this.roleId = roleId;
    this.roleName = roleName;
    this.occurredAt = occurredAt;
  }
}
