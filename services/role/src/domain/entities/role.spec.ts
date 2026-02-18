import { Role } from './role';
import { RoleAbilities } from '../value-objects/role-abilities';
import { RoleId } from '../value-objects/role-id';
import { RoleName } from '../value-objects/role-name';

describe('Role entity', () => {
  it('emits events on create, update, delete', () => {
    const role = Role.create(
      RoleName.create('Admin'),
      RoleAbilities.create({
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      }),
    );

    const createdEvents = role.pullDomainEvents();
    expect(createdEvents).toHaveLength(1);
    expect(createdEvents[0].name).toBe('RoleCreated');

    role.rename(RoleName.create('Manager'));
    role.updateAbilities(
      RoleAbilities.create({
        canView: true,
        canCreate: false,
        canUpdate: true,
        canDelete: false,
      }),
    );
    role.markUpdated();

    const updatedEvents = role.pullDomainEvents();
    expect(updatedEvents).toHaveLength(1);
    expect(updatedEvents[0].name).toBe('RoleUpdated');

    role.markDeleted();
    const deletedEvents = role.pullDomainEvents();
    expect(deletedEvents).toHaveLength(1);
    expect(deletedEvents[0].name).toBe('RoleDeleted');
  });

  it('rehydrates existing role without create event', () => {
    const role = Role.rehydrate({
      id: RoleId.create('role-1'),
      name: RoleName.create('Support'),
      abilities: RoleAbilities.create({
        canView: true,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      }),
    });

    expect(role.pullDomainEvents()).toHaveLength(0);
  });
});
