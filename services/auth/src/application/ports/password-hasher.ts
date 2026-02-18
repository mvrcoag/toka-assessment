import { PasswordHash } from '../../domain/value-objects/password-hash';

export interface PasswordHasher {
  hash(value: string): Promise<PasswordHash>;
  compare(value: string, hash: PasswordHash): Promise<boolean>;
}
