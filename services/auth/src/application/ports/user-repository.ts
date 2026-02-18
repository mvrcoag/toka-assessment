import { Email } from '../../domain/value-objects/email';
import { UserId } from '../../domain/value-objects/user-id';
import { User } from '../../domain/entities/user';

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
}
