import { DomainEvent } from './domain-event';

export class UserUpdatedEvent implements DomainEvent {
  readonly name = 'UserUpdated';
  readonly occurredAt: Date;
  readonly userId: string;
  readonly email: string;
  actorId?: string;
  actorRole?: string;

  constructor(userId: string, email: string, occurredAt: Date = new Date()) {
    this.userId = userId;
    this.email = email;
    this.occurredAt = occurredAt;
  }
}
