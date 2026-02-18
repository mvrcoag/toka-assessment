import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCESS_TOKEN_VERIFIER, EVENT_BUS, ROLE_REPOSITORY } from '../application/ports/tokens';
import { CreateRoleUseCase } from '../application/use-cases/create-role.use-case';
import { DeleteRoleUseCase } from '../application/use-cases/delete-role.use-case';
import { GetRoleUseCase } from '../application/use-cases/get-role.use-case';
import { ListRolesUseCase } from '../application/use-cases/list-roles.use-case';
import { UpdateRoleUseCase } from '../application/use-cases/update-role.use-case';
import { RoleController } from '../presentation/http/role.controller';
import { RoleConfig } from './config/role.config';
import { OidcTokenVerifier } from './security/oidc-token-verifier';
import { RoleEntity } from './typeorm/role.entity';
import { TypeOrmRoleRepository } from './typeorm/typeorm-role.repository';
import { RoleRepository } from '../application/ports/role-repository';
import { RabbitMqEventBus } from './rabbitmq/rabbitmq.event-bus';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const config = new RoleConfig();
        return {
          type: 'postgres',
          url: config.postgresUrl,
          entities: [RoleEntity],
          synchronize: false,
        };
      },
    }),
    TypeOrmModule.forFeature([RoleEntity]),
  ],
  controllers: [RoleController],
  providers: [
    RoleConfig,
    TypeOrmRoleRepository,
    OidcTokenVerifier,
    RabbitMqEventBus,
    {
      provide: EVENT_BUS,
      useExisting: RabbitMqEventBus,
    },
    {
      provide: ROLE_REPOSITORY,
      useExisting: TypeOrmRoleRepository,
    },
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useExisting: OidcTokenVerifier,
    },
    {
      provide: CreateRoleUseCase,
      useFactory: (repo: RoleRepository, eventBus: RabbitMqEventBus) =>
        new CreateRoleUseCase(repo, eventBus),
      inject: [ROLE_REPOSITORY, EVENT_BUS],
    },
    {
      provide: UpdateRoleUseCase,
      useFactory: (repo: RoleRepository, eventBus: RabbitMqEventBus) =>
        new UpdateRoleUseCase(repo, eventBus),
      inject: [ROLE_REPOSITORY, EVENT_BUS],
    },
    {
      provide: DeleteRoleUseCase,
      useFactory: (repo: RoleRepository, eventBus: RabbitMqEventBus) =>
        new DeleteRoleUseCase(repo, eventBus),
      inject: [ROLE_REPOSITORY, EVENT_BUS],
    },
    {
      provide: GetRoleUseCase,
      useFactory: (repo: RoleRepository) => new GetRoleUseCase(repo),
      inject: [ROLE_REPOSITORY],
    },
    {
      provide: ListRolesUseCase,
      useFactory: (repo: RoleRepository) => new ListRolesUseCase(repo),
      inject: [ROLE_REPOSITORY],
    },
  ],
})
export class RoleModule {}
