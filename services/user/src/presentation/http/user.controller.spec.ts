import { UserController } from './user.controller';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { RoleId } from '../../domain/value-objects/role-id';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';

describe('UserController', () => {
  const user = User.create({
    id: UserId.create('user-1'),
    name: UserName.create('Toka User'),
    email: Email.create('user@toka.local'),
    passwordHash: PasswordHash.create('hash'),
    roleId: RoleId.create('role-1'),
  });

  it('lists users', async () => {
    const controller = new UserController(
      { execute: async () => user } as any,
      { execute: async () => user } as any,
      { execute: async () => undefined } as any,
      { execute: async () => user } as any,
      { execute: async () => [user] } as any,
    );

    const result = await controller.list();
    expect(result).toHaveLength(1);
  });

  it('creates and updates user', async () => {
    const controller = new UserController(
      { execute: async () => user } as any,
      { execute: async () => user } as any,
      { execute: async () => undefined } as any,
      { execute: async () => user } as any,
      { execute: async () => [user] } as any,
    );

    const created = await controller.create({
      name: 'Toka User',
      email: 'user@toka.local',
      password: 'secret123',
      roleId: 'role-1',
    });
    expect(created.email).toBe('user@toka.local');

    const updated = await controller.update('user-1', { name: 'New Name' });
    expect(updated.name).toBe('Toka User');
  });

  it('deletes user', async () => {
    const controller = new UserController(
      { execute: async () => user } as any,
      { execute: async () => user } as any,
      { execute: async () => undefined } as any,
      { execute: async () => user } as any,
      { execute: async () => [user] } as any,
    );

    await expect(controller.remove('user-1')).resolves.toBeUndefined();
  });
});
