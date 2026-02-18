import { Role } from '../../domain/entities/role';
import { DomainEvent } from '../../domain/events/domain-event';
import { RoleAbilities } from '../../domain/value-objects/role-abilities';
import { RoleName } from '../../domain/value-objects/role-name';
import { ApplicationError } from '../errors/application-error';
import { EventBus } from '../ports/event-bus';
import { RoleRepository } from '../ports/role-repository';

export interface CreateRoleInput {
  name: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  actorId?: string;
  actorRole?: string;
}

export class CreateRoleUseCase {
  constructor(
    private readonly repository: RoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateRoleInput): Promise<Role> {
    const name = RoleName.create(input.name);
    const existing = await this.repository.findByName(name);
    if (existing) {
      throw new ApplicationError('Role name already exists', 409);
    }

    const abilities = RoleAbilities.create({
      canView: input.canView,
      canCreate: input.canCreate,
      canUpdate: input.canUpdate,
      canDelete: input.canDelete,
    });

    const role = Role.create(name, abilities);
    await this.repository.save(role);
    const events = this.attachActor(role.pullDomainEvents(), input.actorId, input.actorRole);
    await this.eventBus.publishAll(events);
    return role;
  }

  private attachActor(
    events: DomainEvent[],
    actorId?: string,
    actorRole?: string,
  ) {
    if (!actorId && !actorRole) {
      return events;
    }
    events.forEach((event) => {
      event.actorId = actorId;
      event.actorRole = actorRole;
    });
    return events;
  }
}
