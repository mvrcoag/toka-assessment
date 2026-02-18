import { Email } from '../../domain/value-objects/email';
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

    if (input.name && input.name !== user.name.value) {
      user.rename(UserName.create(input.name));
    }

    if (input.email && input.email !== user.email.value) {
      const email = Email.create(input.email);
      const existing = await this.repository.findByEmail(email);
      if (existing && existing.id.value !== user.id.value) {
        throw new ApplicationError('Email already exists', 409);
      }
      user.changeEmail(email);
    }

    if (input.password) {
      const passwordHash = await this.hasher.hash(input.password);
      user.changePassword(passwordHash);
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
    }

    await this.repository.save(user);
    await this.eventBus.publishAll(user.pullDomainEvents());
    return user;
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
