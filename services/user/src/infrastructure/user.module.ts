import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ACCESS_TOKEN_VERIFIER,
  PASSWORD_HASHER,
  USER_REPOSITORY,
} from '../application/ports/tokens';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { GetUserUseCase } from '../application/use-cases/get-user.use-case';
import { ListUsersUseCase } from '../application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { UserController } from '../presentation/http/user.controller';
import { UserConfig } from './config/user.config';
import { BcryptPasswordHasher } from './security/bcrypt-password-hasher';
import { OidcTokenVerifier } from './security/oidc-token-verifier';
import { UserEntity } from './typeorm/user.entity';
import { TypeOrmUserRepository } from './typeorm/typeorm-user.repository';
import { UserRepository } from '../application/ports/user-repository';
import { PasswordHasher } from '../application/ports/password-hasher';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [UserConfig],
      useFactory: (config: UserConfig) => ({
        type: 'postgres',
        url: config.postgresUrl,
        entities: [UserEntity],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [UserController],
  providers: [
    UserConfig,
    TypeOrmUserRepository,
    OidcTokenVerifier,
    {
      provide: USER_REPOSITORY,
      useExisting: TypeOrmUserRepository,
    },
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useExisting: OidcTokenVerifier,
    },
    {
      provide: PASSWORD_HASHER,
      useFactory: () => new BcryptPasswordHasher(10),
    },
    {
      provide: CreateUserUseCase,
      useFactory: (repo: UserRepository, hasher: PasswordHasher) =>
        new CreateUserUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: UpdateUserUseCase,
      useFactory: (repo: UserRepository, hasher: PasswordHasher) =>
        new UpdateUserUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: DeleteUserUseCase,
      useFactory: (repo: UserRepository) => new DeleteUserUseCase(repo),
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
