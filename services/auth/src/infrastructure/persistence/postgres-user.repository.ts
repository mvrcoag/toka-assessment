import { UserRepository } from '../../application/ports/user-repository';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { Role } from '../../domain/value-objects/role';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';
import { PostgresClient } from '../postgres/postgres.client';

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
};

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly postgres: PostgresClient) {}

  async findByEmail(email: Email): Promise<User | null> {
    const result = await this.postgres
      .getPool()
      .query<UserRow>(
        'select id, name, email, password_hash, role from users where email = $1 limit 1',
        [email.value],
      );

    if (result.rowCount === 0) {
      return null;
    }

    return this.toDomain(result.rows[0]);
  }

  async findById(id: UserId): Promise<User | null> {
    const result = await this.postgres
      .getPool()
      .query<UserRow>(
        'select id, name, email, password_hash, role from users where id = $1 limit 1',
        [id.value],
      );

    if (result.rowCount === 0) {
      return null;
    }

    return this.toDomain(result.rows[0]);
  }

  async save(user: User): Promise<void> {
    await this.postgres.getPool().query(
      `
      insert into users (id, name, email, password_hash, role, updated_at)
      values ($1, $2, $3, $4, $5, now())
      on conflict (email)
      do update set
        id = excluded.id,
        name = excluded.name,
        password_hash = excluded.password_hash,
        role = excluded.role,
        updated_at = now();
      `,
      [
        user.id.value,
        user.name.value,
        user.email.value,
        user.passwordHash.value,
        user.role.value,
      ],
    );
  }

  private toDomain(row: UserRow): User {
    return User.create({
      id: UserId.create(row.id),
      name: UserName.create(row.name),
      email: Email.create(row.email),
      passwordHash: PasswordHash.create(row.password_hash),
      role: Role.create(row.role),
    });
  }
}
