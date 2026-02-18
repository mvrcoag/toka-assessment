import { hash, compare } from 'bcryptjs';
import { PasswordHasher } from '../../application/ports/password-hasher';
import { PasswordHash } from '../../domain/value-objects/password-hash';

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds: number = 10) {}

  async hash(value: string): Promise<PasswordHash> {
    const hashed = await hash(value, this.rounds);
    return PasswordHash.create(hashed);
  }

  async compare(value: string, hashValue: PasswordHash): Promise<boolean> {
    return compare(value, hashValue.value);
  }
}
