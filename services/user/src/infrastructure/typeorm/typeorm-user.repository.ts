import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../../application/ports/user-repository';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { Role } from '../../domain/value-objects/role';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';
import { UserEntity } from './user.entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email: email.value } });
    return entity ? this.toDomain(entity) : null;
  }

  async list(): Promise<User[]> {
    const entities = await this.repository.find({ order: { email: 'ASC' } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(user: User): Promise<void> {
    const entity = this.repository.create({
      id: user.id.value,
      name: user.name.value,
      email: user.email.value,
      passwordHash: user.passwordHash.value,
      role: user.role.value,
    });
    await this.repository.save(entity);
  }

  async delete(user: User): Promise<void> {
    await this.repository.delete({ id: user.id.value });
  }

  private toDomain(entity: UserEntity): User {
    return User.rehydrate({
      id: UserId.create(entity.id),
      name: UserName.create(entity.name),
      email: Email.create(entity.email),
      passwordHash: PasswordHash.create(entity.passwordHash),
      role: Role.create(entity.role),
    });
  }
}
