import { DomainEvent } from './domain-event';

export class UserLoggedOutEvent implements DomainEvent {
  readonly name = 'UserLoggedOut';
  readonly occurredAt: Date;
  readonly userId: string;
  actorId?: string;
  actorRole?: string;

  constructor(userId: string, occurredAt: Date = new Date()) {
    this.userId = userId;
    this.occurredAt = occurredAt;
  }
}
