import { Module } from '@nestjs/common';
import { UserModule } from './infrastructure/user.module';

@Module({
  imports: [UserModule],
})
export class AppModule {}
