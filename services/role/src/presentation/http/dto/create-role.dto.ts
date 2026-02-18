import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsBoolean()
  canView!: boolean;

  @IsBoolean()
  canCreate!: boolean;

  @IsBoolean()
  canUpdate!: boolean;

  @IsBoolean()
  canDelete!: boolean;
}
