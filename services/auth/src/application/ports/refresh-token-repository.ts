import { RefreshToken } from '../../domain/entities/refresh-token';

export interface RefreshTokenRecord {
  token: RefreshToken;
  revoked: boolean;
}

export interface RefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  find(tokenId: string): Promise<RefreshTokenRecord | null>;
  revoke(tokenId: string): Promise<void>;
}
