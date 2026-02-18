export interface RoleResponseDto {
  id: string;
  name: string;
  abilities: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}
