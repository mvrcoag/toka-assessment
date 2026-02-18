import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuditModule } from './audit.module';
import { ACCESS_TOKEN_VERIFIER, AUDIT_LOG_REPOSITORY } from '../application/ports/tokens';
import { AuditConfig } from './config/audit.config';
import { OidcTokenVerifier } from './security/oidc-token-verifier';
import { TypeOrmAuditLogRepository } from './typeorm/typeorm-audit-log.repository';
import { CreateAuditLogUseCase } from '../application/use-cases/create-audit-log.use-case';
import { GetAuditLogUseCase } from '../application/use-cases/get-audit-log.use-case';
import { ListAuditLogsUseCase } from '../application/use-cases/list-audit-logs.use-case';

describe('AuditModule providers', () => {
  it('builds provider factories', async () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuditModule) as any[];
    const byToken = (token: unknown) => providers.find((provider) => provider.provide === token);

    const repo = {
      findById: jest.fn(),
      list: jest.fn(),
      save: jest.fn(),
    } as unknown as TypeOrmAuditLogRepository;

    expect(byToken(AUDIT_LOG_REPOSITORY).useExisting).toBe(TypeOrmAuditLogRepository);
    expect(byToken(ACCESS_TOKEN_VERIFIER).useExisting).toBe(OidcTokenVerifier);

    const createUseCase = byToken(CreateAuditLogUseCase).useFactory(repo);
    const getUseCase = byToken(GetAuditLogUseCase).useFactory(repo);
    const listUseCase = byToken(ListAuditLogsUseCase).useFactory(repo);

    expect(createUseCase).toBeInstanceOf(CreateAuditLogUseCase);
    expect(getUseCase).toBeInstanceOf(GetAuditLogUseCase);
    expect(listUseCase).toBeInstanceOf(ListAuditLogsUseCase);

    const configProvider = providers.find((provider) => provider === AuditConfig);
    expect(configProvider).toBeDefined();
  });
});
