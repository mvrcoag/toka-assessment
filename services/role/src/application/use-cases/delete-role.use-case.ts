import { RoleId } from '../../domain/value-objects/role-id';
import { DomainEvent } from '../../domain/events/domain-event';
import { ApplicationError } from '../errors/application-error';
import { EventBus } from '../ports/event-bus';
import { RoleRepository } from '../ports/role-repository';

export class DeleteRoleUseCase {
  constructor(
    private readonly repository: RoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string, actorId?: string, actorRole?: string): Promise<void> {
    const roleId = RoleId.create(id);
    const role = await this.repository.findById(roleId);
    if (!role) {
      throw new ApplicationError('Role not found', 404);
    }

    role.markDeleted();
    await this.repository.delete(role);
    const events = this.attachActor(role.pullDomainEvents(), actorId, actorRole);
    await this.eventBus.publishAll(events);
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
