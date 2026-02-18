import { DomainEvent } from './domain-event';

export class UserCreatedEvent implements DomainEvent {
  readonly name = 'UserCreated';
  readonly occurredAt: Date;
  readonly userId: string;
  readonly email: string;

  constructor(userId: string, email: string, occurredAt: Date = new Date()) {
    this.userId = userId;
    this.email = email;
    this.occurredAt = occurredAt;
  }
}
