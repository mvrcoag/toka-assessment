import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApplicationError } from '../../application/errors/application-error';
import { GetUserByEmailUseCase } from '../../application/use-cases/get-user-by-email.use-case';
import { GetUserUseCase } from '../../application/use-cases/get-user.use-case';
import { User } from '../../domain/entities/user';
import { InternalUserResponseDto } from './dto/internal-user-response.dto';
import { InternalAuthGuard } from './guards/internal-auth.guard';

@Controller('internal/users')
@UseGuards(InternalAuthGuard)
export class InternalUserController {
  constructor(
    private readonly getUser: GetUserUseCase,
    private readonly getUserByEmail: GetUserByEmailUseCase,
  ) {}

  @Get()
  async byEmail(@Query('email') email?: string): Promise<InternalUserResponseDto> {
    if (!email) {
      throw new ApplicationError('Email is required', 400);
    }
    const user = await this.getUserByEmail.execute(email);
    return this.toResponse(user);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<InternalUserResponseDto> {
    const user = await this.getUser.execute(id);
    return this.toResponse(user);
  }

  private toResponse(user: User): InternalUserResponseDto {
    return {
      id: user.id.value,
      name: user.name.value,
      email: user.email.value,
      passwordHash: user.passwordHash.value,
      roleId: user.roleId.value,
    };
  }
}
