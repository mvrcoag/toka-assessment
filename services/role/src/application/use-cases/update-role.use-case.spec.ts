import { UpdateRoleUseCase } from './update-role.use-case';
import { ApplicationError } from '../errors/application-error';
import { Role } from '../../domain/entities/role';
import { RoleAbilities } from '../../domain/value-objects/role-abilities';
import { RoleId } from '../../domain/value-objects/role-id';
import { RoleName } from '../../domain/value-objects/role-name';

describe('UpdateRoleUseCase', () => {
  const buildRole = (name: string) =>
    Role.rehydrate({
      id: RoleId.create('role-1'),
      name: RoleName.create(name),
      abilities: RoleAbilities.create({
        canView: true,
        canCreate: true,
        canUpdate: false,
        canDelete: false,
      }),
    });

  it('updates name and abilities', async () => {
    const repository = {
      findById: async () => buildRole('Admin'),
      findByName: async () => null,
      list: async () => [],
      save: async () => undefined,
      delete: async () => undefined,
    };
    const useCase = new UpdateRoleUseCase(repository, {
      publish: async () => undefined,
      publishAll: async () => undefined,
    });

    const updated = await useCase.execute({
      id: 'role-1',
      name: 'Manager',
      canUpdate: true,
    });

    expect(updated.name.value).toBe('Manager');
    expect(updated.abilities.canUpdate).toBe(true);
  });

  it('rejects missing role', async () => {
    const repository = {
      findById: async () => null,
      findByName: async () => null,
      list: async () => [],
      save: async () => undefined,
      delete: async () => undefined,
    };
    const useCase = new UpdateRoleUseCase(repository, {
      publish: async () => undefined,
      publishAll: async () => undefined,
    });

    await expect(useCase.execute({ id: 'missing' })).rejects.toBeInstanceOf(
      ApplicationError,
    );
  });

  it('rejects duplicate name', async () => {
    const repository = {
      findById: async () => buildRole('Admin'),
      findByName: async () =>
        Role.rehydrate({
          id: RoleId.create('role-2'),
          name: RoleName.create('Manager'),
          abilities: RoleAbilities.create({
            canView: true,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
          }),
        }),
      list: async () => [],
      save: async () => undefined,
      delete: async () => undefined,
    };
    const useCase = new UpdateRoleUseCase(repository, {
      publish: async () => undefined,
      publishAll: async () => undefined,
    });

    await expect(
      useCase.execute({ id: 'role-1', name: 'Manager' }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it('skips name check when name is unchanged', async () => {
    const repository = {
      findById: async () => buildRole('Admin'),
      findByName: async () => null,
      list: async () => [],
      save: async () => undefined,
      delete: async () => undefined,
    };
    const useCase = new UpdateRoleUseCase(repository);

    await expect(
      useCase.execute({ id: 'role-1', name: 'Admin' }),
    ).resolves.toBeDefined();
  });
});
