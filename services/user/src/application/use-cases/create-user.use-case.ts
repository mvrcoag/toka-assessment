import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { RoleId } from '../../domain/value-objects/role-id';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';
import { ApplicationError } from '../errors/application-error';
import { EventBus } from '../ports/event-bus';
import { PasswordHasher } from '../ports/password-hasher';
import { RoleLookup } from '../ports/role-lookup';
import { UserRepository } from '../ports/user-repository';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleId: string;
  accessToken?: string;
}

export class CreateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly eventBus: EventBus,
    private readonly roleLookup: RoleLookup,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const email = Email.create(input.email);
    const existing = await this.repository.findByEmail(email);
    if (existing) {
      throw new ApplicationError('Email already exists', 409);
    }

    const roleExists = await this.assertRoleExists(
      input.roleId,
      input.accessToken,
    );
    if (!roleExists) {
      throw new ApplicationError('Role does not exist', 400);
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = User.create({
      id: UserId.generate(),
      name: UserName.create(input.name),
      email,
      passwordHash,
      roleId: RoleId.create(input.roleId),
    });

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
