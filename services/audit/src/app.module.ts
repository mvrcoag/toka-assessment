import { Module } from '@nestjs/common';
import { AuditModule } from './infrastructure/audit.module';

@Module({
  imports: [AuditModule],
})
export class AppModule {}
