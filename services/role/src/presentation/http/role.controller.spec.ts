import { RoleController } from './role.controller';
import { Role } from '../../domain/entities/role';
import { RoleAbilities } from '../../domain/value-objects/role-abilities';
import { RoleId } from '../../domain/value-objects/role-id';
import { RoleName } from '../../domain/value-objects/role-name';

describe('RoleController', () => {
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

  it('lists roles', async () => {
    const controller = new RoleController(
      { execute: async () => role } as any,
      { execute: async () => role } as any,
      { execute: async () => undefined } as any,
      { execute: async () => role } as any,
      { execute: async () => [role] } as any,
    );

    const result = await controller.list();
    expect(result).toHaveLength(1);
  });

  it('gets role by id', async () => {
    const controller = new RoleController(
      { execute: async () => role } as any,
      { execute: async () => role } as any,
      { execute: async () => undefined } as any,
      { execute: async () => role } as any,
      { execute: async () => [role] } as any,
    );

    const result = await controller.get('role-1');
    expect(result.id).toBe('role-1');
  });

  it('creates role', async () => {
    const controller = new RoleController(
      { execute: async () => role } as any,
      { execute: async () => role } as any,
      { execute: async () => undefined } as any,
      { execute: async () => role } as any,
      { execute: async () => [role] } as any,
    );

    const result = await controller.create({
      name: 'Admin',
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    });
    expect(result.name).toBe('Admin');
  });

  it('updates role', async () => {
    const controller = new RoleController(
      { execute: async () => role } as any,
      { execute: async () => role } as any,
      { execute: async () => undefined } as any,
      { execute: async () => role } as any,
      { execute: async () => [role] } as any,
    );

    const result = await controller.update('role-1', { name: 'Manager' });
    expect(result.id).toBe('role-1');
  });

  it('deletes role', async () => {
    const controller = new RoleController(
      { execute: async () => role } as any,
      { execute: async () => role } as any,
      { execute: async () => undefined } as any,
      { execute: async () => role } as any,
      { execute: async () => [role] } as any,
    );

    await expect(controller.remove('role-1')).resolves.toBeUndefined();
  });
});
