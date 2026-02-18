import { Repository } from 'typeorm';
import { TypeOrmUserRepository } from './typeorm-user.repository';
import { UserEntity } from './user.entity';
import { Email } from '../../domain/value-objects/email';
import { User } from '../../domain/entities/user';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { RoleId } from '../../domain/value-objects/role-id';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';

describe('TypeOrmUserRepository', () => {
  const buildRepo = (entities: UserEntity[] = []) => {
    const repository = {
      findOne: jest.fn(async () => entities[0] ?? null),
      find: jest.fn(async () => entities),
      create: jest.fn((input) => input),
      save: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
    } as unknown as Repository<UserEntity>;

    return { repository, sut: new TypeOrmUserRepository(repository) };
  };

  it('maps entity to domain', async () => {
    const entity = {
      id: 'user-1',
      name: 'Toka User',
      email: 'user@toka.local',
      passwordHash: 'hash',
      roleId: 'role-1',
    } as UserEntity;
    const { sut } = buildRepo([entity]);

    const user = await sut.findByEmail(Email.create('user@toka.local'));
    expect(user?.id.value).toBe('user-1');
  });

  it('lists users', async () => {
    const entities = [
      {
        id: 'user-1',
        name: 'Toka User',
        email: 'user@toka.local',
        passwordHash: 'hash',
        roleId: 'role-1',
      } as UserEntity,
    ];
    const { sut } = buildRepo(entities);
    const users = await sut.list();
    expect(users).toHaveLength(1);
  });

  it('saves and deletes users', async () => {
    const { sut, repository } = buildRepo();
    const user = User.create({
      id: UserId.create('user-1'),
      name: UserName.create('Toka User'),
      email: Email.create('user@toka.local'),
      passwordHash: PasswordHash.create('hash'),
      roleId: RoleId.create('role-1'),
    });

    await sut.save(user);
    await sut.delete(user);
    expect(repository.save).toHaveBeenCalled();
    expect(repository.delete).toHaveBeenCalled();
  });
});
