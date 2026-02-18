import { AuthCodeRepository } from '../../application/ports/auth-code-repository';
import { AuthCode } from '../../domain/entities/auth-code';
import { Scope } from '../../domain/value-objects/scope';
import { UserId } from '../../domain/value-objects/user-id';
import { RedisClient } from '../redis/redis.client';

interface StoredAuthCode {
  code: string;
  userId: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  expiresAt: string;
}

export class RedisAuthCodeRepository implements AuthCodeRepository {
  constructor(private readonly redis: RedisClient) {}

  async save(code: AuthCode): Promise<void> {
    const key = this.key(code.code);
    const ttlSeconds = Math.max(
      1,
      Math.floor((code.expiresAt.getTime() - Date.now()) / 1000),
    );

    const payload: StoredAuthCode = {
      code: code.code,
      userId: code.userId.value,
      clientId: code.clientId,
      redirectUri: code.redirectUri,
      scope: code.scope.toString(),
      expiresAt: code.expiresAt.toISOString(),
    };

    await this.redis.getClient().set(key, JSON.stringify(payload), {
      EX: ttlSeconds,
    });
  }

  async consume(code: string): Promise<AuthCode | null> {
    const key = this.key(code);
    const raw = await this.redis.getClient().get(key);
    if (!raw) {
      return null;
    }

    await this.redis.getClient().del(key);
    const data = JSON.parse(raw) as StoredAuthCode;

    return AuthCode.issue({
      code: data.code,
      userId: UserId.create(data.userId),
      clientId: data.clientId,
      redirectUri: data.redirectUri,
      scope: Scope.from(data.scope),
      expiresAt: new Date(data.expiresAt),
    });
  }

  private key(code: string): string {
    return `auth_code:${code}`;
  }
}
