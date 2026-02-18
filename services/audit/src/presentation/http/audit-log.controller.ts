import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApplicationError } from '../../application/errors/application-error';
import { GetAuditLogUseCase } from '../../application/use-cases/get-audit-log.use-case';
import { ListAuditLogsUseCase } from '../../application/use-cases/list-audit-logs.use-case';
import { AuditLog } from '../../domain/entities/audit-log';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('logs')
@UseGuards(AuthGuard)
export class AuditLogController {
  constructor(
    private readonly getAuditLog: GetAuditLogUseCase,
    private readonly listAuditLogs: ListAuditLogsUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListAuditLogsDto): Promise<AuditLogResponseDto[]> {
    const logs = await this.listAuditLogs.execute({
      action: query.action,
      resource: query.resource,
      actorId: query.actorId,
      from: this.parseDate(query.from),
      to: this.parseDate(query.to),
    });

    return logs.map((log) => this.toResponse(log));
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<AuditLogResponseDto> {
    const log = await this.getAuditLog.execute(id);
    return this.toResponse(log);
  }

  private toResponse(log: AuditLog): AuditLogResponseDto {
    return {
      id: log.id?.value ?? '',
      action: log.action.value,
      resource: log.resource.value,
      actorId: log.actorId,
      actorRole: log.actorRole,
      metadata: log.metadata,
      occurredAt: log.occurredAt.toISOString(),
    };
  }

  private parseDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new ApplicationError('Invalid date format', 400);
    }

    return date;
  }
}
