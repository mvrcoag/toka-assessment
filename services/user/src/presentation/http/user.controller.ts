import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { GetUserUseCase } from '../../application/use-cases/get-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { User } from '../../domain/entities/user';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly listUsers: ListUsersUseCase,
  ) {}

  @Get()
  async list(): Promise<UserResponseDto[]> {
    const users = await this.listUsers.execute();
    return users.map((user) => this.toResponse(user));
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.getUser.execute(id);
    return this.toResponse(user);
  }

  @Post()
  async create(
    @Body() body: CreateUserDto,
    @Headers('authorization') authorization?: string,
  ): Promise<UserResponseDto> {
    const user = await this.createUser.execute({
      ...body,
      accessToken: authorization,
    });
    return this.toResponse(user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @Headers('authorization') authorization?: string,
  ): Promise<UserResponseDto> {
    const user = await this.updateUser.execute({
      id,
      ...body,
      accessToken: authorization,
    });
    return this.toResponse(user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUser.execute(id);
  }

  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id.value,
      name: user.name.value,
      email: user.email.value,
      roleId: user.roleId.value,
    };
  }
}
