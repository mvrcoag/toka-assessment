import { PostgresClient } from './postgres.client';
import { AuthConfig } from '../config/auth.config';

const end = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ end })),
}));

describe('PostgresClient', () => {
  it('creates pool and closes it', async () => {
    const config = { postgresUrl: 'postgresql://test' } as AuthConfig;
    const client = new PostgresClient(config);
    expect(client.getPool()).toBeDefined();
    await client.onModuleDestroy();
    const { Pool } = require('pg');
    expect(Pool).toHaveBeenCalled();
    expect(end).toHaveBeenCalled();
  });
});
