import { ListRolesUseCase } from './list-roles.use-case';
import { Role } from '../../domain/entities/role';
import { RoleAbilities } from '../../domain/value-objects/role-abilities';
import { RoleId } from '../../domain/value-objects/role-id';
import { RoleName } from '../../domain/value-objects/role-name';

describe('ListRolesUseCase', () => {
  it('returns roles list', async () => {
    const roles = [
      Role.rehydrate({
        id: RoleId.create('role-1'),
        name: RoleName.create('Admin'),
        abilities: RoleAbilities.create({
          canView: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        }),
      }),
    ];
    const repository = {
      findById: async () => null,
      findByName: async () => null,
      list: async () => roles,
      save: async () => undefined,
      delete: async () => undefined,
    };
    const useCase = new ListRolesUseCase(repository);

    await expect(useCase.execute()).resolves.toEqual(roles);
  });
});
