import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CheckRoleExistsUseCase } from '../../application/use-cases/check-role-exists.use-case';
import { CreateRoleUseCase } from '../../application/use-cases/create-role.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/delete-role.use-case';
import { GetRoleUseCase } from '../../application/use-cases/get-role.use-case';
import { ListRolesUseCase } from '../../application/use-cases/list-roles.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/update-role.use-case';
import { Role } from '../../domain/entities/role';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuthGuard } from './guards/auth.guard';
import { RoleAbilitiesGuard } from './guards/role-abilities.guard';

@Controller('roles')
@UseGuards(AuthGuard, RoleAbilitiesGuard)
export class RoleController {
  constructor(
    private readonly createRole: CreateRoleUseCase,
    private readonly updateRole: UpdateRoleUseCase,
    private readonly deleteRole: DeleteRoleUseCase,
    private readonly getRole: GetRoleUseCase,
    private readonly listRoles: ListRolesUseCase,
    private readonly checkRoleExists: CheckRoleExistsUseCase,
  ) {}

  @Get()
  async list(): Promise<RoleResponseDto[]> {
    const roles = await this.listRoles.execute();
    return roles.map((role) => this.toResponse(role));
  }

  @Get('exists')
  async exists(@Query('id') id?: string): Promise<{ exists: boolean }> {
    if (!id) {
      return { exists: false };
    }
    const exists = await this.checkRoleExists.execute(id);
    return { exists };
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<RoleResponseDto> {
    const role = await this.getRole.execute(id);
    return this.toResponse(role);
  }

  @Post()
  async create(
    @Body() body: CreateRoleDto,
    @Req() request: Request,
  ): Promise<RoleResponseDto> {
    const actor = (request as any).user as { sub?: string; role?: string } | undefined;
    const role = await this.createRole.execute({
      ...body,
      actorId: actor?.sub,
      actorRole: actor?.role,
    });
    return this.toResponse(role);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateRoleDto,
    @Req() request: Request,
  ): Promise<RoleResponseDto> {
    const actor = (request as any).user as { sub?: string; role?: string } | undefined;
    const role = await this.updateRole.execute({
      id,
      ...body,
      actorId: actor?.sub,
      actorRole: actor?.role,
    });
    return this.toResponse(role);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() request: Request): Promise<void> {
    const actor = (request as any).user as { sub?: string; role?: string } | undefined;
    await this.deleteRole.execute(id, actor?.sub, actor?.role);
  }

  private toResponse(role: Role): RoleResponseDto {
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
