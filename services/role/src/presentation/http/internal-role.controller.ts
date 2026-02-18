import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GetRoleUseCase } from '../../application/use-cases/get-role.use-case';
import { Role } from '../../domain/entities/role';
import { InternalAuthGuard } from './guards/internal-auth.guard';

interface InternalRoleResponseDto {
  id: string;
  name: string;
  abilities: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

@Controller('internal/roles')
@UseGuards(InternalAuthGuard)
export class InternalRoleController {
  constructor(private readonly getRole: GetRoleUseCase) {}

  @Get(':id')
  async get(@Param('id') id: string): Promise<InternalRoleResponseDto> {
    const role = await this.getRole.execute(id);
    return this.toResponse(role);
  }

  private toResponse(role: Role): InternalRoleResponseDto {
    return {
      id: role.id.value,
      name: role.name.value,
      abilities: {
        canView: role.abilities.canView,
        canCreate: role.abilities.canCreate,
        canUpdate: role.abilities.canUpdate,
        canDelete: role.abilities.canDelete,
      },
    };
  }
}
