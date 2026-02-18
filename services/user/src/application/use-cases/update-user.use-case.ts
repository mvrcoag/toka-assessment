import { Email } from '../../domain/value-objects/email';
import { DomainEvent } from '../../domain/events/domain-event';
import { RoleId } from '../../domain/value-objects/role-id';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';
import { ApplicationError } from '../errors/application-error';
import { EventBus } from '../ports/event-bus';
import { PasswordHasher } from '../ports/password-hasher';
import { RoleLookup } from '../ports/role-lookup';
import { UserRepository } from '../ports/user-repository';

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
  accessToken?: string;
  actorId?: string;
  actorRole?: string;
}

export class UpdateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly eventBus: EventBus,
    private readonly roleLookup: RoleLookup,
  ) {}

  async execute(input: UpdateUserInput) {
    const userId = UserId.create(input.id);
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ApplicationError('User not found', 404);
    }

    let hasChanges = false;

    if (input.name && input.name !== user.name.value) {
      user.rename(UserName.create(input.name));
      hasChanges = true;
    }

    if (input.email && input.email !== user.email.value) {
      const email = Email.create(input.email);
      const existing = await this.repository.findByEmail(email);
      if (existing && existing.id.value !== user.id.value) {
        throw new ApplicationError('Email already exists', 409);
      }
      user.changeEmail(email);
      hasChanges = true;
    }

    if (input.password) {
      const passwordHash = await this.hasher.hash(input.password);
      user.changePassword(passwordHash);
      hasChanges = true;
    }

    if (input.roleId && input.roleId !== user.roleId.value) {
      const roleExists = await this.assertRoleExists(
        input.roleId,
        input.accessToken,
      );
      if (!roleExists) {
        throw new ApplicationError('Role does not exist', 400);
      }
      user.changeRole(RoleId.create(input.roleId));
      hasChanges = true;
    }

    if (!hasChanges) {
      return user;
    }

    user.markUpdated();

    await this.repository.save(user);
    const events = this.attachActor(user.pullDomainEvents(), input.actorId, input.actorRole);
    await this.eventBus.publishAll(events);
    return user;
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

  private async assertRoleExists(
    roleId: string,
    accessToken?: string,
  ): Promise<boolean> {
    try {
      return await this.roleLookup.exists(roleId, accessToken);
    } catch {
      throw new ApplicationError('Unable to validate role', 502);
    }
  }
}
