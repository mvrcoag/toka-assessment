import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCESS_TOKEN_VERIFIER, AUDIT_LOG_REPOSITORY } from '../application/ports/tokens';
import { CreateAuditLogUseCase } from '../application/use-cases/create-audit-log.use-case';
import { GetAuditLogUseCase } from '../application/use-cases/get-audit-log.use-case';
import { ListAuditLogsUseCase } from '../application/use-cases/list-audit-logs.use-case';
import { AuditLogController } from '../presentation/http/audit-log.controller';
import { AuditConfig } from './config/audit.config';
import { OidcTokenVerifier } from './security/oidc-token-verifier';
import { AuditLogEntity } from './typeorm/audit-log.entity';
import { TypeOrmAuditLogRepository } from './typeorm/typeorm-audit-log.repository';
import { AuditLogRepository } from '../application/ports/audit-log-repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [AuditConfig],
      useFactory: (config: AuditConfig) => ({
        type: 'mongodb',
        url: config.mongoUrl,
        entities: [AuditLogEntity],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([AuditLogEntity]),
  ],
  controllers: [AuditLogController],
  providers: [
    AuditConfig,
    TypeOrmAuditLogRepository,
    OidcTokenVerifier,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useExisting: TypeOrmAuditLogRepository,
    },
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useExisting: OidcTokenVerifier,
    },
    {
      provide: CreateAuditLogUseCase,
      useFactory: (repo: AuditLogRepository) => new CreateAuditLogUseCase(repo),
      inject: [AUDIT_LOG_REPOSITORY],
    },
    {
      provide: GetAuditLogUseCase,
      useFactory: (repo: AuditLogRepository) => new GetAuditLogUseCase(repo),
      inject: [AUDIT_LOG_REPOSITORY],
    },
    {
      provide: ListAuditLogsUseCase,
      useFactory: (repo: AuditLogRepository) => new ListAuditLogsUseCase(repo),
      inject: [AUDIT_LOG_REPOSITORY],
    },
  ],
})
export class AuditModule {}
