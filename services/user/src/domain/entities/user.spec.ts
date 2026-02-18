import { User } from './user';
import { Email } from '../value-objects/email';
import { PasswordHash } from '../value-objects/password-hash';
import { RoleId } from '../value-objects/role-id';
import { UserId } from '../value-objects/user-id';
import { UserName } from '../value-objects/user-name';

describe('User', () => {
  it('records domain events for mutations', () => {
    const user = User.create({
      id: UserId.create('user-1'),
      name: UserName.create('Toka User'),
      email: Email.create('user@toka.local'),
      passwordHash: PasswordHash.create('hash'),
      roleId: RoleId.create('role-1'),
    });

    user.rename(UserName.create('New Name'));
    user.changeEmail(Email.create('new@toka.local'));
    user.changeRole(RoleId.create('role-2'));
    user.changePassword(PasswordHash.create('hash2'));
    user.markDeleted();

    const events = user.pullDomainEvents();
    expect(events.length).toBeGreaterThan(1);
    expect(events[0].name).toBe('UserCreated');
    expect(user.pullDomainEvents()).toHaveLength(0);
  });
});
