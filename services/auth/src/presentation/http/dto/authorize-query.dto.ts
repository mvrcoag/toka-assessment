import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class AuthorizeQueryDto {
  @IsString()
  @IsNotEmpty()
  client_id!: string;

  @IsUrl({ require_tld: false })
  redirect_uri!: string;

  @IsIn(['code'])
  response_type!: string;

  @IsString()
  @IsNotEmpty()
  scope!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  nonce?: string;
}
