import { PostgresUserRepository } from './postgres-user.repository';
import { Email } from '../../domain/value-objects/email';
import { User } from '../../domain/entities/user';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { Role } from '../../domain/value-objects/role';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';

describe('PostgresUserRepository', () => {
  it('maps rows to domain users', async () => {
    const query = jest.fn().mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          id: 'user-1',
          name: 'Toka User',
          email: 'user@toka.local',
          password_hash: 'hash',
          role: 'user',
        },
      ],
    });
    const postgres = { getPool: () => ({ query }) } as any;
    const repo = new PostgresUserRepository(postgres);

    const user = await repo.findByEmail(Email.create('user@toka.local'));
    expect(user?.id.value).toBe('user-1');
    expect(query).toHaveBeenCalled();
  });

  it('returns null when no rows found', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 0, rows: [] });
    const postgres = { getPool: () => ({ query }) } as any;
    const repo = new PostgresUserRepository(postgres);

    const user = await repo.findById(UserId.create('missing'));
    expect(user).toBeNull();
  });

  it('returns null for missing email', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 0, rows: [] });
    const postgres = { getPool: () => ({ query }) } as any;
    const repo = new PostgresUserRepository(postgres);

    const user = await repo.findByEmail(Email.create('missing@toka.local'));
    expect(user).toBeNull();
  });

  it('saves user via upsert', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 1, rows: [] });
    const postgres = { getPool: () => ({ query }) } as any;
    const repo = new PostgresUserRepository(postgres);
    const user = User.create({
      id: UserId.create('user-1'),
      name: UserName.create('Toka User'),
      email: Email.create('user@toka.local'),
      passwordHash: PasswordHash.create('hash'),
      role: Role.create('user'),
    });

    await repo.save(user);
    expect(query).toHaveBeenCalled();
  });
});
