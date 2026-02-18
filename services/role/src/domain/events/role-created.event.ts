import { DomainEvent } from './domain-event';

export class RoleCreatedEvent implements DomainEvent {
  readonly name = 'RoleCreated';
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
