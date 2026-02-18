import { RedisRefreshTokenRepository } from './redis-refresh-token.repository';
import { RefreshToken } from '../../domain/entities/refresh-token';
import { Scope } from '../../domain/value-objects/scope';
import { UserId } from '../../domain/value-objects/user-id';

describe('RedisRefreshTokenRepository', () => {
  it('saves, finds, and revokes refresh tokens', async () => {
    const store = new Map<string, string>();
    const client = {
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      del: jest.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
    };
    const redis = { getClient: () => client } as any;
    const repo = new RedisRefreshTokenRepository(redis);
    const token = RefreshToken.issue({
      tokenId: 'refresh-1',
      userId: UserId.create('user-1'),
      clientId: 'client-1',
      scope: Scope.from('openid'),
      expiresAt: new Date(Date.now() + 10000),
    });

    await repo.save(token);
    const found = await repo.find('refresh-1');
    expect(found?.token.tokenId).toBe('refresh-1');
    await repo.revoke('refresh-1');
    const revoked = await repo.find('refresh-1');
    expect(revoked?.revoked).toBe(true);
  });

  it('returns null for missing token', async () => {
    const store = new Map<string, string>();
    const client = {
      set: jest.fn(async () => 'OK'),
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      del: jest.fn(async () => 0),
    };
    const redis = { getClient: () => client } as any;
    const repo = new RedisRefreshTokenRepository(redis);
    const result = await repo.find('missing');
    expect(result).toBeNull();
    await repo.revoke('missing');
  });
});
