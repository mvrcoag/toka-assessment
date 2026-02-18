import { Repository } from 'typeorm';
import { TypeOrmUserRepository } from './typeorm-user.repository';
import { UserEntity } from './user.entity';
import { Email } from '../../domain/value-objects/email';
import { User } from '../../domain/entities/user';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { Role } from '../../domain/value-objects/role';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';

describe('TypeOrmUserRepository', () => {
  const buildRepo = (entity?: UserEntity) => {
    const repository = {
      findOne: jest.fn(async () => entity ?? null),
      create: jest.fn((input) => input),
      save: jest.fn(async () => undefined),
    } as unknown as Repository<UserEntity>;

    return { repository, sut: new TypeOrmUserRepository(repository) };
  };

  it('maps entity to domain', async () => {
    const entity = {
      id: 'user-1',
      name: 'Toka User',
      email: 'user@toka.local',
      passwordHash: 'hash',
      role: 'user',
    } as UserEntity;
    const { sut } = buildRepo(entity);

    const user = await sut.findByEmail(Email.create('user@toka.local'));
    expect(user?.id.value).toBe('user-1');
  });

  it('returns null when not found', async () => {
    const { sut } = buildRepo();
    const user = await sut.findById(UserId.create('missing'));
    expect(user).toBeNull();
  });

  it('saves user entity', async () => {
    const { sut, repository } = buildRepo();
    const user = User.create({
      id: UserId.create('user-1'),
      name: UserName.create('Toka User'),
      email: Email.create('user@toka.local'),
      passwordHash: PasswordHash.create('hash'),
      role: Role.create('user'),
    });

    await sut.save(user);
    expect((repository.create as jest.Mock).mock.calls[0][0]).toMatchObject({
      id: 'user-1',
      email: 'user@toka.local',
    });
    expect(repository.save).toHaveBeenCalled();
  });
});
