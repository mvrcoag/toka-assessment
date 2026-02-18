import { RedisAuthCodeRepository } from './redis-auth-code.repository';
import { AuthCode } from '../../domain/entities/auth-code';
import { Scope } from '../../domain/value-objects/scope';
import { UserId } from '../../domain/value-objects/user-id';

describe('RedisAuthCodeRepository', () => {
  it('saves and consumes auth code', async () => {
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
    const repo = new RedisAuthCodeRepository(redis);
    const authCode = AuthCode.issue({
      code: 'code-123',
      userId: UserId.create('user-1'),
      clientId: 'client-1',
      redirectUri: 'http://localhost/callback',
      scope: Scope.from('openid'),
      expiresAt: new Date(Date.now() + 10000),
    });

    await repo.save(authCode);
    const consumed = await repo.consume('code-123');
    expect(consumed?.code).toBe('code-123');
    const missing = await repo.consume('code-123');
    expect(missing).toBeNull();
  });
});
