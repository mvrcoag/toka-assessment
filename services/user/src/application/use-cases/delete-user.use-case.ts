import { UserId } from '../../domain/value-objects/user-id';
import { DomainEvent } from '../../domain/events/domain-event';
import { ApplicationError } from '../errors/application-error';
import { EventBus } from '../ports/event-bus';
import { UserRepository } from '../ports/user-repository';

export class DeleteUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string, actorId?: string, actorRole?: string): Promise<void> {
    const userId = UserId.create(id);
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ApplicationError('User not found', 404);
    }

    user.markDeleted();
    await this.repository.delete(user);
    const events = this.attachActor(user.pullDomainEvents(), actorId, actorRole);
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
