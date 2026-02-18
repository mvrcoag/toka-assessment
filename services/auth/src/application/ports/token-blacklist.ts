export interface TokenBlacklist {
  blacklist(tokenId: string, expiresAt: Date): Promise<void>;
  isBlacklisted(tokenId: string): Promise<boolean>;
}
