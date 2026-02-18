import { RefreshTokenRepository } from '../../application/ports/refresh-token-repository';
import { RefreshToken } from '../../domain/entities/refresh-token';
import { Scope } from '../../domain/value-objects/scope';
import { UserId } from '../../domain/value-objects/user-id';
import { RedisClient } from '../redis/redis.client';

interface StoredRefreshToken {
  tokenId: string;
  userId: string;
  clientId: string;
  scope: string;
  expiresAt: string;
  revoked: boolean;
}

export class RedisRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly redis: RedisClient) {}

  async save(token: RefreshToken): Promise<void> {
    const key = this.key(token.tokenId);
    const ttlSeconds = Math.max(
      1,
      Math.floor((token.expiresAt.getTime() - Date.now()) / 1000),
    );

    const payload: StoredRefreshToken = {
      tokenId: token.tokenId,
      userId: token.userId.value,
      clientId: token.clientId,
      scope: token.scope.toString(),
      expiresAt: token.expiresAt.toISOString(),
      revoked: false,
    };

    await this.redis.getClient().set(key, JSON.stringify(payload), {
      EX: ttlSeconds,
    });
  }

  async find(tokenId: string): Promise<{ token: RefreshToken; revoked: boolean } | null> {
    const raw = await this.redis.getClient().get(this.key(tokenId));
    if (!raw) {
      return null;
    }

    const data = JSON.parse(raw) as StoredRefreshToken;

    return {
      token: RefreshToken.issue({
        tokenId: data.tokenId,
        userId: UserId.create(data.userId),
        clientId: data.clientId,
        scope: Scope.from(data.scope),
        expiresAt: new Date(data.expiresAt),
      }),
      revoked: data.revoked,
    };
  }

  async revoke(tokenId: string): Promise<void> {
    const key = this.key(tokenId);
    const raw = await this.redis.getClient().get(key);
    if (!raw) {
      return;
    }

    const data = JSON.parse(raw) as StoredRefreshToken;
    data.revoked = true;

    const ttlSeconds = Math.max(
      1,
      Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000),
    );

    await this.redis.getClient().set(key, JSON.stringify(data), {
      EX: ttlSeconds,
    });
  }

  private key(tokenId: string): string {
    return `refresh_token:${tokenId}`;
  }
}
