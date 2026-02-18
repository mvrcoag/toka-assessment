import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthConfig } from '../config/auth.config';

@Injectable()
export class PostgresClient implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly config: AuthConfig) {
    this.pool = new Pool({ connectionString: this.config.postgresUrl });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }

}
