import { DomainEvent } from '../events/domain-event';
import { RoleCreatedEvent } from '../events/role-created.event';
import { RoleDeletedEvent } from '../events/role-deleted.event';
import { RoleUpdatedEvent } from '../events/role-updated.event';
import { RoleAbilities } from '../value-objects/role-abilities';
import { RoleId } from '../value-objects/role-id';
import { RoleName } from '../value-objects/role-name';

export interface RoleProps {
  id: RoleId;
  name: RoleName;
  abilities: RoleAbilities;
}

export class Role {
  private props: RoleProps;
  private domainEvents: DomainEvent[] = [];

  private constructor(props: RoleProps) {
    this.props = props;
  }

  static create(name: RoleName, abilities: RoleAbilities, id?: RoleId): Role {
    const role = new Role({
      id: id ?? RoleId.generate(),
      name,
      abilities,
    });
    role.domainEvents.push(new RoleCreatedEvent(role.id.value, role.name.value));
    return role;
  }

  static rehydrate(props: RoleProps): Role {
    return new Role(props);
  }

  get id(): RoleId {
    return this.props.id;
  }

  get name(): RoleName {
    return this.props.name;
  }

  get abilities(): RoleAbilities {
    return this.props.abilities;
  }

  rename(name: RoleName): void {
    this.props.name = name;
  }

  updateAbilities(abilities: RoleAbilities): void {
    this.props.abilities = abilities;
  }

  markUpdated(): void {
    this.domainEvents.push(new RoleUpdatedEvent(this.id.value, this.name.value));
  }

  markDeleted(): void {
    this.domainEvents.push(new RoleDeletedEvent(this.id.value, this.name.value));
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}
