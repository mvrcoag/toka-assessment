import { DeleteRoleUseCase } from './delete-role.use-case';
import { ApplicationError } from '../errors/application-error';
import { Role } from '../../domain/entities/role';
import { RoleAbilities } from '../../domain/value-objects/role-abilities';
import { RoleId } from '../../domain/value-objects/role-id';
import { RoleName } from '../../domain/value-objects/role-name';

describe('DeleteRoleUseCase', () => {
  it('deletes existing role', async () => {
    const role = Role.rehydrate({
      id: RoleId.create('role-1'),
      name: RoleName.create('Admin'),
      abilities: RoleAbilities.create({
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      }),
    });

    const repository = {
      findById: async () => role,
      findByName: async () => null,
      list: async () => [],
      save: async () => undefined,
      delete: async () => undefined,
    };
    const useCase = new DeleteRoleUseCase(repository, {
      publish: async () => undefined,
      publishAll: async () => undefined,
    });

    await expect(useCase.execute('role-1')).resolves.toBeUndefined();
  });

  it('rejects missing role', async () => {
    const repository = {
      findById: async () => null,
      findByName: async () => null,
      list: async () => [],
      save: async () => undefined,
      delete: async () => undefined,
    };
    const useCase = new DeleteRoleUseCase(repository, {
      publish: async () => undefined,
      publishAll: async () => undefined,
    });

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ApplicationError);
  });
});
