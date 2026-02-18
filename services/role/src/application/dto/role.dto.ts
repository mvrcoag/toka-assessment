export interface RoleDto {
  id: string;
  name: string;
  abilities: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}
