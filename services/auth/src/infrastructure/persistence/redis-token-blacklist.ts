import { TokenBlacklist } from '../../application/ports/token-blacklist';
import { RedisClient } from '../redis/redis.client';

export class RedisTokenBlacklist implements TokenBlacklist {
  constructor(private readonly redis: RedisClient) {}

  async blacklist(tokenId: string, expiresAt: Date): Promise<void> {
    const ttlSeconds = Math.max(
      1,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );

    await this.redis.getClient().set(this.key(tokenId), '1', {
      EX: ttlSeconds,
    });
  }

  async isBlacklisted(tokenId: string): Promise<boolean> {
    const exists = await this.redis.getClient().exists(this.key(tokenId));
    return exists === 1;
  }

  private key(tokenId: string): string {
    return `token_blacklist:${tokenId}`;
  }
}
