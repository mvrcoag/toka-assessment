import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  name!: string;

  @Column({ type: 'boolean', name: 'can_view' })
  canView!: boolean;

  @Column({ type: 'boolean', name: 'can_create' })
  canCreate!: boolean;

  @Column({ type: 'boolean', name: 'can_update' })
  canUpdate!: boolean;

  @Column({ type: 'boolean', name: 'can_delete' })
  canDelete!: boolean;
}
