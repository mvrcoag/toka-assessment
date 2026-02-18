import { RedisTokenBlacklist } from './redis-token-blacklist';

describe('RedisTokenBlacklist', () => {
  it('tracks blacklisted tokens', async () => {
    const store = new Map<string, string>();
    const client = {
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      exists: jest.fn(async (key: string) => (store.has(key) ? 1 : 0)),
    };
    const redis = { getClient: () => client } as any;
    const blacklist = new RedisTokenBlacklist(redis);

    await blacklist.blacklist('token-1', new Date(Date.now() + 10000));
    await expect(blacklist.isBlacklisted('token-1')).resolves.toBe(true);
    await expect(blacklist.isBlacklisted('token-2')).resolves.toBe(false);
  });
});
