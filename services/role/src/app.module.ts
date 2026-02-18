import { Module } from '@nestjs/common';
import { RoleModule } from './infrastructure/role.module';

@Module({
  imports: [RoleModule],
})
export class AppModule {}
