import { IsOptional, IsString } from 'class-validator';

export class LogoutRequestDto {
  @IsOptional()
  @IsString()
  refresh_token?: string;
}
