import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { UserId } from '../../domain/value-objects/user-id';

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  list(): Promise<User[]>;
  save(user: User): Promise<void>;
  delete(user: User): Promise<void>;
}
