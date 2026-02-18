import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { Role } from '../../domain/value-objects/role';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';
import { ApplicationError } from '../errors/application-error';
import { PasswordHasher } from '../ports/password-hasher';
import { UserRepository } from '../ports/user-repository';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
}

export class CreateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const email = Email.create(input.email);
    const existing = await this.repository.findByEmail(email);
    if (existing) {
      throw new ApplicationError('Email already exists', 409);
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = User.create({
      id: UserId.generate(),
      name: UserName.create(input.name),
      email,
      passwordHash,
      role: Role.create(input.role),
    });

    await this.repository.save(user);
    return user;
  }
}
