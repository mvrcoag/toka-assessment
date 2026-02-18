import { User } from './user';
import { Email } from '../value-objects/email';
import { PasswordHash } from '../value-objects/password-hash';
import { RoleId } from '../value-objects/role-id';
import { UserId } from '../value-objects/user-id';
import { UserName } from '../value-objects/user-name';

describe('User', () => {
  it('records login events', () => {
    const user = User.create({
      id: UserId.create('user-1'),
      name: UserName.create('Toka User'),
      email: Email.create('user@toka.local'),
      passwordHash: PasswordHash.create('hash'),
      roleId: RoleId.create('role-1'),
    });

    user.recordLogin();
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('UserLoggedIn');
    expect(user.pullDomainEvents()).toHaveLength(0);
  });
});
