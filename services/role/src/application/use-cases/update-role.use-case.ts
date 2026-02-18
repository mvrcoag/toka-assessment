import { RoleAbilities } from '../../domain/value-objects/role-abilities';
import { DomainEvent } from '../../domain/events/domain-event';
import { RoleId } from '../../domain/value-objects/role-id';
import { RoleName } from '../../domain/value-objects/role-name';
import { ApplicationError } from '../errors/application-error';
import { EventBus } from '../ports/event-bus';
import { RoleRepository } from '../ports/role-repository';

export interface UpdateRoleInput {
  id: string;
  name?: string;
  canView?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  actorId?: string;
  actorRole?: string;
}

export class UpdateRoleUseCase {
  constructor(
    private readonly repository: RoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateRoleInput) {
    const roleId = RoleId.create(input.id);
    const role = await this.repository.findById(roleId);
    if (!role) {
      throw new ApplicationError('Role not found', 404);
    }

    let hasChanges = false;

    if (input.name && input.name !== role.name.value) {
      const name = RoleName.create(input.name);
      const existing = await this.repository.findByName(name);
      if (existing && existing.id.value !== role.id.value) {
        throw new ApplicationError('Role name already exists', 409);
      }
      role.rename(name);
      hasChanges = true;
    }

    if (
      input.canView !== undefined ||
      input.canCreate !== undefined ||
      input.canUpdate !== undefined ||
      input.canDelete !== undefined
    ) {
      const abilities = RoleAbilities.create({
        canView: input.canView ?? role.abilities.canView,
        canCreate: input.canCreate ?? role.abilities.canCreate,
        canUpdate: input.canUpdate ?? role.abilities.canUpdate,
        canDelete: input.canDelete ?? role.abilities.canDelete,
      });
      role.updateAbilities(abilities);
      hasChanges = true;
    }

    if (!hasChanges) {
      return role;
    }

    role.markUpdated();

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
