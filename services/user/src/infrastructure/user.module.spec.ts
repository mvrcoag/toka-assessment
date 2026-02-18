import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { UserModule } from './user.module';
import {
  ACCESS_TOKEN_VERIFIER,
  EVENT_BUS,
  PASSWORD_HASHER,
  ROLE_LOOKUP,
  USER_REPOSITORY,
} from '../application/ports/tokens';
import { UserConfig } from './config/user.config';
import { BcryptPasswordHasher } from './security/bcrypt-password-hasher';
import { OidcTokenVerifier } from './security/oidc-token-verifier';
import { TypeOrmUserRepository } from './typeorm/typeorm-user.repository';
import { RabbitMqEventBus } from './rabbitmq/rabbitmq.event-bus';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { GetUserUseCase } from '../application/use-cases/get-user.use-case';
import { GetUserByEmailUseCase } from '../application/use-cases/get-user-by-email.use-case';
import { ListUsersUseCase } from '../application/use-cases/list-users.use-case';

describe('UserModule providers', () => {
  it('builds provider factories', () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, UserModule) as any[];
    const byToken = (token: unknown) => providers.find((provider) => provider.provide === token);

    const userRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as TypeOrmUserRepository;

    const passwordHasher = byToken(PASSWORD_HASHER).useFactory();
    expect(passwordHasher).toBeInstanceOf(BcryptPasswordHasher);

    expect(byToken(USER_REPOSITORY).useExisting).toBe(TypeOrmUserRepository);
    expect(byToken(ACCESS_TOKEN_VERIFIER).useExisting).toBe(OidcTokenVerifier);
    expect(byToken(EVENT_BUS).useExisting).toBe(RabbitMqEventBus);
    expect(byToken(ROLE_LOOKUP).useExisting).toBeDefined();

    const eventBus = {} as RabbitMqEventBus;
    const roleLookup = { exists: jest.fn() } as any;
    const createUser = byToken(CreateUserUseCase).useFactory(
      userRepo,
      passwordHasher,
      eventBus,
      roleLookup,
    );
    const updateUser = byToken(UpdateUserUseCase).useFactory(
      userRepo,
      passwordHasher,
      eventBus,
      roleLookup,
    );
    const deleteUser = byToken(DeleteUserUseCase).useFactory(userRepo, eventBus);
    const getUser = byToken(GetUserUseCase).useFactory(userRepo);
    const getUserByEmail = byToken(GetUserByEmailUseCase).useFactory(userRepo);
    const listUsers = byToken(ListUsersUseCase).useFactory(userRepo);

    expect(createUser).toBeInstanceOf(CreateUserUseCase);
    expect(updateUser).toBeInstanceOf(UpdateUserUseCase);
    expect(deleteUser).toBeInstanceOf(DeleteUserUseCase);
    expect(getUser).toBeInstanceOf(GetUserUseCase);
    expect(getUserByEmail).toBeInstanceOf(GetUserByEmailUseCase);
    expect(listUsers).toBeInstanceOf(ListUsersUseCase);

    const config = new UserConfig();
    expect(config.postgresUrl).toBeDefined();
  });
});
