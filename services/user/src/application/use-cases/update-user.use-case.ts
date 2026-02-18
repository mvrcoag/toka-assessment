import { Email } from '../../domain/value-objects/email';
import { Role } from '../../domain/value-objects/role';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';
import { ApplicationError } from '../errors/application-error';
import { EventBus } from '../ports/event-bus';
import { PasswordHasher } from '../ports/password-hasher';
import { UserRepository } from '../ports/user-repository';

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export class UpdateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly eventBus: EventBus,
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

    if (input.role && input.role !== user.role.value) {
      user.changeRole(Role.create(input.role));
    }

    await this.repository.save(user);
    await this.eventBus.publishAll(user.pullDomainEvents());
    return user;
  }
}
