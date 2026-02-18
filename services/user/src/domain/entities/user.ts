import { DomainEvent } from '../events/domain-event';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserDeletedEvent } from '../events/user-deleted.event';
import { UserUpdatedEvent } from '../events/user-updated.event';
import { Email } from '../value-objects/email';
import { PasswordHash } from '../value-objects/password-hash';
import { RoleId } from '../value-objects/role-id';
import { UserId } from '../value-objects/user-id';
import { UserName } from '../value-objects/user-name';

export interface UserProps {
  id: UserId;
  name: UserName;
  email: Email;
  passwordHash: PasswordHash;
  roleId: RoleId;
}

export class User {
  private props: UserProps;
  private domainEvents: DomainEvent[] = [];

  private constructor(props: UserProps) {
    this.props = props;
  }

  static create(props: UserProps): User {
    const user = new User(props);
    user.domainEvents.push(new UserCreatedEvent(user.id.value, user.email.value));
    return user;
  }

  static rehydrate(props: UserProps): User {
    return new User(props);
  }

  get id(): UserId {
    return this.props.id;
  }

  get name(): UserName {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): PasswordHash {
    return this.props.passwordHash;
  }

  get roleId(): RoleId {
    return this.props.roleId;
  }

  rename(name: UserName): void {
    this.props.name = name;
  }

  changeEmail(email: Email): void {
    this.props.email = email;
  }

  changePassword(passwordHash: PasswordHash): void {
    this.props.passwordHash = passwordHash;
  }

  changeRole(roleId: RoleId): void {
    this.props.roleId = roleId;
  }

  markUpdated(): void {
    this.domainEvents.push(new UserUpdatedEvent(this.id.value, this.email.value));
  }

  markDeleted(): void {
    this.domainEvents.push(new UserDeletedEvent(this.id.value, this.email.value));
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}
