import { DeleteUserUseCase } from './delete-user.use-case';
import { ApplicationError } from '../errors/application-error';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { RoleId } from '../../domain/value-objects/role-id';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';

describe('DeleteUserUseCase', () => {
  it('deletes user', async () => {
    const user = User.create({
      id: UserId.create('user-1'),
      name: UserName.create('Toka User'),
      email: Email.create('user@toka.local'),
      passwordHash: PasswordHash.create('hash'),
      roleId: RoleId.create('role-1'),
    });
    const useCase = new DeleteUserUseCase(
      {
        findById: async () => user,
        findByEmail: async () => null,
        list: async () => [],
        save: async () => undefined,
        delete: async () => undefined,
      },
      {
        publish: async () => undefined,
        publishAll: async () => undefined,
      },
    );

    await expect(useCase.execute('user-1')).resolves.toBeUndefined();
  });

  it('rejects missing user', async () => {
    const useCase = new DeleteUserUseCase(
      {
        findById: async () => null,
        findByEmail: async () => null,
        list: async () => [],
        save: async () => undefined,
        delete: async () => undefined,
      },
      {
        publish: async () => undefined,
        publishAll: async () => undefined,
      },
    );

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      ApplicationError,
    );
  });
});
