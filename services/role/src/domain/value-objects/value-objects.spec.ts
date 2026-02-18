import { DomainError } from '../errors/domain-error';
import { RoleAbilities } from './role-abilities';
import { RoleId } from './role-id';
import { RoleName } from './role-name';

describe('Role value objects', () => {
  it('creates role name with validation', () => {
    const name = RoleName.create('Admin');
    expect(name.value).toBe('Admin');
    expect(() => RoleName.create('')).toThrow(DomainError);
    expect(() => RoleName.create('A')).toThrow(DomainError);
  });

  it('creates role id and trims', () => {
    const id = RoleId.create(' role-1 ');
    expect(id.value).toBe('role-1');
  });

  it('generates role id', () => {
    const id = RoleId.generate();
    expect(id.value).toHaveLength(36);
  });

  it('creates role abilities with booleans', () => {
    const abilities = RoleAbilities.create({
      canView: true,
      canCreate: false,
      canUpdate: true,
      canDelete: false,
    });
    expect(abilities.canView).toBe(true);
    expect(abilities.canCreate).toBe(false);
    expect(abilities.canUpdate).toBe(true);
    expect(abilities.canDelete).toBe(false);
    expect(() => RoleAbilities.create(undefined as any)).toThrow(DomainError);
  });
});
