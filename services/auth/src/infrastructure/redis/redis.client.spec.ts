import { RedisClient } from './redis.client';
import { AuthConfig } from '../config/auth.config';

const state = { isOpen: false };
const connect = jest.fn(async () => {
  state.isOpen = true;
});
const quit = jest.fn(async () => {
  state.isOpen = false;
});

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect,
    quit,
    get isOpen() {
      return state.isOpen;
    },
  })),
}));

describe('RedisClient', () => {
  it('connects and disconnects', async () => {
    const config = { redisUrl: 'redis://test' } as AuthConfig;
    const client = new RedisClient(config);
    await client.onModuleInit();
    expect(client.getClient()).toBeDefined();
    await client.onModuleDestroy();
    expect(connect).toHaveBeenCalled();
    expect(quit).toHaveBeenCalled();
  });
});
