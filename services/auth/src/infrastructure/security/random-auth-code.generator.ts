import { randomUUID } from 'crypto';
import { AuthCodeGenerator } from '../../application/ports/auth-code-generator';

export class RandomAuthCodeGenerator implements AuthCodeGenerator {
  generate(): string {
    return randomUUID().replace(/-/g, '');
  }
}
