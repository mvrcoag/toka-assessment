import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { RoleModule } from './role.module';
import {
  ACCESS_TOKEN_VERIFIER,
  EVENT_BUS,
  ROLE_REPOSITORY,
} from '../application/ports/tokens';
import { RoleConfig } from './config/role.config';
import { TypeOrmRoleRepository } from './typeorm/typeorm-role.repository';
import { OidcTokenVerifier } from './security/oidc-token-verifier';
import { RabbitMqEventBus } from './rabbitmq/rabbitmq.event-bus';
import { CreateRoleUseCase } from '../application/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from '../application/use-cases/update-role.use-case';
import { DeleteRoleUseCase } from '../application/use-cases/delete-role.use-case';
import { GetRoleUseCase } from '../application/use-cases/get-role.use-case';
import { ListRolesUseCase } from '../application/use-cases/list-roles.use-case';

describe('RoleModule providers', () => {
  it('wires providers', () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, RoleModule) as any[];
    const byToken = (token: unknown) => providers.find((provider) => provider.provide === token);

    expect(byToken(ROLE_REPOSITORY).useExisting).toBe(TypeOrmRoleRepository);
    expect(byToken(ACCESS_TOKEN_VERIFIER).useExisting).toBe(OidcTokenVerifier);
    expect(byToken(EVENT_BUS).useExisting).toBe(RabbitMqEventBus);

    const repo = {} as TypeOrmRoleRepository;
    const eventBus = {} as RabbitMqEventBus;
    const create = byToken(CreateRoleUseCase).useFactory(repo, eventBus);
    const update = byToken(UpdateRoleUseCase).useFactory(repo, eventBus);
    const del = byToken(DeleteRoleUseCase).useFactory(repo, eventBus);
    const get = byToken(GetRoleUseCase).useFactory(repo);
    const list = byToken(ListRolesUseCase).useFactory(repo);

    expect(create).toBeInstanceOf(CreateRoleUseCase);
    expect(update).toBeInstanceOf(UpdateRoleUseCase);
    expect(del).toBeInstanceOf(DeleteRoleUseCase);
    expect(get).toBeInstanceOf(GetRoleUseCase);
    expect(list).toBeInstanceOf(ListRolesUseCase);

    const config = providers.find((provider) => provider === RoleConfig);
    expect(config).toBe(RoleConfig);
  });
});
