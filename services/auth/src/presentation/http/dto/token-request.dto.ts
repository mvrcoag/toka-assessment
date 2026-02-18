import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class TokenRequestDto {
  @IsIn(['authorization_code', 'refresh_token'])
  grant_type!: string;

  @IsString()
  @IsNotEmpty()
  client_id!: string;

  @IsString()
  @IsNotEmpty()
  client_secret!: string;

  @ValidateIf((o) => o.grant_type === 'authorization_code')
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ValidateIf((o) => o.grant_type === 'authorization_code')
  @IsUrl({ require_tld: false })
  redirect_uri?: string;

  @ValidateIf((o) => o.grant_type === 'refresh_token')
  @IsString()
  @IsNotEmpty()
  refresh_token?: string;

  @IsOptional()
  @IsString()
  scope?: string;
}
