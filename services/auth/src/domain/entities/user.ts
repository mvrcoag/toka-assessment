import { DomainEvent } from '../events/domain-event';
import { UserLoggedInEvent } from '../events/user-logged-in.event';
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
  private readonly props: UserProps;
  private domainEvents: DomainEvent[] = [];

  private constructor(props: UserProps) {
    this.props = props;
  }

  static create(props: UserProps): User {
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

  recordLogin(): void {
    this.domainEvents.push(new UserLoggedInEvent(this.id.value));
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}
