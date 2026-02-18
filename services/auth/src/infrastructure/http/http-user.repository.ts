import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../application/ports/user-repository';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { RoleId } from '../../domain/value-objects/role-id';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';
import { AuthConfig } from '../config/auth.config';

interface InternalUserResponse {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  roleId: string;
}

@Injectable()
export class HttpUserRepository implements UserRepository {
  constructor(private readonly config: AuthConfig) {}

  async findByEmail(email: Email): Promise<User | null> {
    const url = new URL(this.config.userServiceUrl);
    url.searchParams.set('email', email.value);
    return this.fetchUser(url.toString());
  }

  async findById(id: UserId): Promise<User | null> {
    const url = `${this.config.userServiceUrl}/${id.value}`;
    return this.fetchUser(url);
  }

  async save(): Promise<void> {
    throw new Error('User save is not supported via auth service');
  }

  private async fetchUser(url: string): Promise<User | null> {
    const response = await fetch(url, {
      headers: {
        'x-service-token': this.config.internalServiceToken,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`User lookup failed with status ${response.status}`);
    }

    const payload = (await response.json()) as InternalUserResponse;
    return User.rehydrate({
      id: UserId.create(payload.id),
      name: UserName.create(payload.name),
      email: Email.create(payload.email),
      passwordHash: PasswordHash.create(payload.passwordHash),
      roleId: RoleId.create(payload.roleId),
    });
  }
}
