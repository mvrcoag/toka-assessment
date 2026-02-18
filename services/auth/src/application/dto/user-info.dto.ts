export interface UserInfoDto {
  sub: string;
  name: string;
  email: string;
  roleId: string;
  roleAbilities?: {
    canView?: boolean;
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
}
