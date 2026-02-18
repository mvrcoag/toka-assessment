import { CreateRoleUseCase } from './create-role.use-case';
import { ApplicationError } from '../errors/application-error';
import { Role } from '../../domain/entities/role';
import { RoleAbilities } from '../../domain/value-objects/role-abilities';
import { RoleName } from '../../domain/value-objects/role-name';

describe('CreateRoleUseCase', () => {
  it('creates role when name is unique', async () => {
    const repository = {
      findByName: async () => null,
      findById: async () => null,
      list: async () => [],
      save: async () => undefined,
      delete: async () => undefined,
    };

    const useCase = new CreateRoleUseCase(repository, {
      publish: async () => undefined,
      publishAll: async () => undefined,
    });
    const role = await useCase.execute({
      name: 'Admin',
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    });

    expect(role).toBeInstanceOf(Role);
    expect(role.name.value).toBe('Admin');
  });

  it('rejects duplicate role name', async () => {
    const repository = {
      findByName: async () =>
        Role.rehydrate({
          id: { value: 'role-1' } as any,
          name: RoleName.create('Admin'),
          abilities: RoleAbilities.create({
            canView: true,
            canCreate: true,
            canUpdate: true,
            canDelete: true,
          }),
        }),
      findById: async () => null,
      list: async () => [],
      save: async () => undefined,
      delete: async () => undefined,
    };

    const useCase = new CreateRoleUseCase(repository, {
      publish: async () => undefined,
      publishAll: async () => undefined,
    });
    await expect(
      useCase.execute({
        name: 'Admin',
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
