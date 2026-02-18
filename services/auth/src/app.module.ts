import { Module } from '@nestjs/common';
import { AuthModule } from './infrastructure/auth.module';

@Module({
  imports: [AuthModule],
})
export class AppModule {}
