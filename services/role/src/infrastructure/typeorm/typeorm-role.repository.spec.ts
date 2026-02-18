import { Repository } from 'typeorm';
import { TypeOrmRoleRepository } from './typeorm-role.repository';
import { RoleEntity } from './role.entity';
import { Role } from '../../domain/entities/role';
import { RoleAbilities } from '../../domain/value-objects/role-abilities';
import { RoleId } from '../../domain/value-objects/role-id';
import { RoleName } from '../../domain/value-objects/role-name';

describe('TypeOrmRoleRepository', () => {
  const buildRepo = (entity?: RoleEntity, entities?: RoleEntity[]) => {
    const repository = {
      findOne: jest.fn(async () => entity ?? null),
      find: jest.fn(async () => entities ?? []),
      create: jest.fn((input) => input),
      save: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
    } as unknown as Repository<RoleEntity>;

    return { repository, sut: new TypeOrmRoleRepository(repository) };
  };

  it('maps entity to domain', async () => {
    const entity = {
      id: 'role-1',
      name: 'Admin',
      canView: true,
      canCreate: true,
      canUpdate: false,
      canDelete: false,
    } as RoleEntity;
    const { sut } = buildRepo(entity);
    const role = await sut.findById(RoleId.create('role-1'));
    expect(role?.name.value).toBe('Admin');
  });

  it('returns null when not found', async () => {
    const { sut } = buildRepo();
    const role = await sut.findByName(RoleName.create('missing'));
    expect(role).toBeNull();
  });

  it('lists roles', async () => {
    const entities = [
      {
        id: 'role-1',
        name: 'Admin',
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      } as RoleEntity,
    ];
    const { sut } = buildRepo(undefined, entities);
    const roles = await sut.list();
    expect(roles).toHaveLength(1);
  });

  it('saves and deletes role', async () => {
    const { sut, repository } = buildRepo();
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

    await sut.save(role);
    await sut.delete(role);
    expect(repository.save).toHaveBeenCalled();
    expect(repository.delete).toHaveBeenCalled();
  });
});
