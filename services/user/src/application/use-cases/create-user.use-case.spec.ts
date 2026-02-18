import { CreateUserUseCase } from './create-user.use-case';
import { ApplicationError } from '../errors/application-error';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { RoleId } from '../../domain/value-objects/role-id';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';

describe('CreateUserUseCase', () => {
  it('creates a user', async () => {
    const useCase = new CreateUserUseCase(
      {
        findByEmail: async () => null,
        findById: async () => null,
        list: async () => [],
        save: async () => undefined,
        delete: async () => undefined,
      },
      {
        hash: async () => PasswordHash.create('hashed'),
      },
      {
        publish: async () => undefined,
        publishAll: async () => undefined,
      },
      {
        exists: async () => true,
      },
    );

    const user = await useCase.execute({
      name: 'Toka User',
      email: 'user@toka.local',
      password: 'secret123',
      roleId: 'role-1',
    });

    expect(user.email.value).toBe('user@toka.local');
  });

  it('rejects duplicate email', async () => {
    const existing = User.create({
      id: UserId.create('user-1'),
      name: UserName.create('Toka User'),
      email: Email.create('user@toka.local'),
      passwordHash: PasswordHash.create('hash'),
      roleId: RoleId.create('role-1'),
    });
    const useCase = new CreateUserUseCase(
      {
        findByEmail: async () => existing,
        findById: async () => null,
        list: async () => [],
        save: async () => undefined,
        delete: async () => undefined,
      },
      {
        hash: async () => PasswordHash.create('hashed'),
      },
      {
        publish: async () => undefined,
        publishAll: async () => undefined,
      },
      {
        exists: async () => true,
      },
    );

    await expect(
      useCase.execute({
        name: 'Toka User',
        email: 'user@toka.local',
        password: 'secret123',
        roleId: 'role-1',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
