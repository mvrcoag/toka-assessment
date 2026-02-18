import { UpdateUserUseCase } from './update-user.use-case';
import { ApplicationError } from '../errors/application-error';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { RoleId } from '../../domain/value-objects/role-id';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';

describe('UpdateUserUseCase', () => {
  const user = User.create({
    id: UserId.create('user-1'),
    name: UserName.create('Toka User'),
    email: Email.create('user@toka.local'),
    passwordHash: PasswordHash.create('hash'),
    roleId: RoleId.create('role-1'),
  });

  it('updates user fields', async () => {
    const useCase = new UpdateUserUseCase(
      {
        findById: async () => user,
        findByEmail: async () => null,
        list: async () => [],
        save: async () => undefined,
        delete: async () => undefined,
      },
      {
        hash: async () => PasswordHash.create('hash2'),
      },
      {
        publish: async () => undefined,
        publishAll: async () => undefined,
      },
      {
        exists: async () => true,
      },
    );

    const updated = await useCase.execute({
      id: 'user-1',
      name: 'New Name',
      email: 'new@toka.local',
      password: 'newpass',
      roleId: 'role-2',
    });

    expect(updated.name.value).toBe('New Name');
    expect(updated.email.value).toBe('new@toka.local');
    expect(updated.roleId.value).toBe('role-2');
  });

  it('rejects missing user', async () => {
    const useCase = new UpdateUserUseCase(
      {
        findById: async () => null,
        findByEmail: async () => null,
        list: async () => [],
        save: async () => undefined,
        delete: async () => undefined,
      },
      {
        hash: async () => PasswordHash.create('hash2'),
      },
      {
        publish: async () => undefined,
        publishAll: async () => undefined,
      },
      {
        exists: async () => true,
      },
    );

    await expect(useCase.execute({ id: 'missing' })).rejects.toBeInstanceOf(
      ApplicationError,
    );
  });

  it('rejects duplicate email', async () => {
    const duplicate = User.create({
      id: UserId.create('user-2'),
      name: UserName.create('Other'),
      email: Email.create('dup@toka.local'),
      passwordHash: PasswordHash.create('hash'),
      roleId: RoleId.create('role-1'),
    });
    const useCase = new UpdateUserUseCase(
      {
        findById: async () => user,
        findByEmail: async () => duplicate,
        list: async () => [],
        save: async () => undefined,
        delete: async () => undefined,
      },
      {
        hash: async () => PasswordHash.create('hash2'),
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
      useCase.execute({ id: 'user-1', email: 'dup@toka.local' }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
