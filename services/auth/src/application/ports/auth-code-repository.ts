import { AuthCode } from '../../domain/entities/auth-code';

export interface AuthCodeRepository {
  save(code: AuthCode): Promise<void>;
  consume(code: string): Promise<AuthCode | null>;
}
