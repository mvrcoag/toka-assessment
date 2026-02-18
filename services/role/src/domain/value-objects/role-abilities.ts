import { DomainError } from '../errors/domain-error';

export interface RoleAbilitiesProps {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export class RoleAbilities {
  private readonly props: RoleAbilitiesProps;

  private constructor(props: RoleAbilitiesProps) {
    this.props = props;
  }

  static create(props: RoleAbilitiesProps): RoleAbilities {
    if (!props) {
      throw new DomainError('Role abilities are required');
    }

    return new RoleAbilities({
      canView: Boolean(props.canView),
      canCreate: Boolean(props.canCreate),
      canUpdate: Boolean(props.canUpdate),
      canDelete: Boolean(props.canDelete),
    });
  }

  get canView(): boolean {
    return this.props.canView;
  }

  get canCreate(): boolean {
    return this.props.canCreate;
  }

  get canUpdate(): boolean {
    return this.props.canUpdate;
  }

  get canDelete(): boolean {
    return this.props.canDelete;
  }
}
