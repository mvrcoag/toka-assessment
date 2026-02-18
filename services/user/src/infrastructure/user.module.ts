import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ACCESS_TOKEN_VERIFIER,
  EVENT_BUS,
  PASSWORD_HASHER,
  ROLE_LOOKUP,
  USER_REPOSITORY,
} from '../application/ports/tokens';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { GetUserByEmailUseCase } from '../application/use-cases/get-user-by-email.use-case';
import { GetUserUseCase } from '../application/use-cases/get-user.use-case';
import { ListUsersUseCase } from '../application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { UserController } from '../presentation/http/user.controller';
import { InternalUserController } from '../presentation/http/internal-user.controller';
import { InternalAuthGuard } from '../presentation/http/guards/internal-auth.guard';
import { UserConfig } from './config/user.config';
import { BcryptPasswordHasher } from './security/bcrypt-password-hasher';
import { OidcTokenVerifier } from './security/oidc-token-verifier';
import { UserEntity } from './typeorm/user.entity';
import { TypeOrmUserRepository } from './typeorm/typeorm-user.repository';
import { UserRepository } from '../application/ports/user-repository';
import { PasswordHasher } from '../application/ports/password-hasher';
import { RabbitMqEventBus } from './rabbitmq/rabbitmq.event-bus';
import { HttpRoleLookup } from './http/http-role-lookup';
import { RoleLookup } from '../application/ports/role-lookup';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const config = new UserConfig();
        return {
          type: 'postgres',
          url: config.postgresUrl,
          entities: [UserEntity],
          synchronize: false,
        };
      },
    }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [UserController, InternalUserController],
  providers: [
    UserConfig,
    TypeOrmUserRepository,
    OidcTokenVerifier,
    RabbitMqEventBus,
    InternalAuthGuard,
    HttpRoleLookup,
    {
      provide: EVENT_BUS,
      useExisting: RabbitMqEventBus,
    },
    {
      provide: USER_REPOSITORY,
      useExisting: TypeOrmUserRepository,
    },
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useExisting: OidcTokenVerifier,
    },
    {
      provide: ROLE_LOOKUP,
      useExisting: HttpRoleLookup,
    },
    {
      provide: PASSWORD_HASHER,
      useFactory: () => new BcryptPasswordHasher(10),
    },
    {
      provide: CreateUserUseCase,
      useFactory: (
        repo: UserRepository,
        hasher: PasswordHasher,
        eventBus: RabbitMqEventBus,
        roleLookup: RoleLookup,
      ) => new CreateUserUseCase(repo, hasher, eventBus, roleLookup),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, EVENT_BUS, ROLE_LOOKUP],
    },
    {
      provide: UpdateUserUseCase,
      useFactory: (
        repo: UserRepository,
        hasher: PasswordHasher,
        eventBus: RabbitMqEventBus,
        roleLookup: RoleLookup,
      ) => new UpdateUserUseCase(repo, hasher, eventBus, roleLookup),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, EVENT_BUS, ROLE_LOOKUP],
    },
    {
      provide: DeleteUserUseCase,
      useFactory: (repo: UserRepository, eventBus: RabbitMqEventBus) =>
        new DeleteUserUseCase(repo, eventBus),
      inject: [USER_REPOSITORY, EVENT_BUS],
    },
    {
      provide: GetUserByEmailUseCase,
      useFactory: (repo: UserRepository) => new GetUserByEmailUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: GetUserUseCase,
      useFactory: (repo: UserRepository) => new GetUserUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: ListUsersUseCase,
      useFactory: (repo: UserRepository) => new ListUsersUseCase(repo),
      inject: [USER_REPOSITORY],
    },
  ],
})
export class UserModule {}
