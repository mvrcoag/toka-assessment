import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleRepository } from '../../application/ports/role-repository';
import { Role } from '../../domain/entities/role';
import { RoleAbilities } from '../../domain/value-objects/role-abilities';
import { RoleId } from '../../domain/value-objects/role-id';
import { RoleName } from '../../domain/value-objects/role-name';
import { RoleEntity } from './role.entity';

@Injectable()
export class TypeOrmRoleRepository implements RoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly repository: Repository<RoleEntity>,
  ) {}

  async findById(id: RoleId): Promise<Role | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByName(name: RoleName): Promise<Role | null> {
    const entity = await this.repository.findOne({ where: { name: name.value } });
    return entity ? this.toDomain(entity) : null;
  }

  async list(): Promise<Role[]> {
    const entities = await this.repository.find({ order: { name: 'ASC' } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(role: Role): Promise<void> {
    const entity = this.repository.create({
      id: role.id.value,
      name: role.name.value,
      canView: role.abilities.canView,
      canCreate: role.abilities.canCreate,
      canUpdate: role.abilities.canUpdate,
      canDelete: role.abilities.canDelete,
    });
    await this.repository.save(entity);
  }

  async delete(role: Role): Promise<void> {
    await this.repository.delete({ id: role.id.value });
  }

  private toDomain(entity: RoleEntity): Role {
    return Role.rehydrate({
      id: RoleId.create(entity.id),
      name: RoleName.create(entity.name),
      abilities: RoleAbilities.create({
        canView: entity.canView,
        canCreate: entity.canCreate,
        canUpdate: entity.canUpdate,
        canDelete: entity.canDelete,
      }),
    });
  }
}
