from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True)
class UserRecord:
    user_id: str
    name: str
    email: str
    role_id: str
    role_name: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


@dataclass(frozen=True)
class RoleRecord:
    role_id: str
    name: str
    can_view: bool
    can_create: bool
    can_update: bool
    can_delete: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


@dataclass(frozen=True)
class AuditRecord:
    audit_id: str
    action: str
    resource: str
    actor_id: str | None
    actor_role: str | None
    occurred_at: datetime | None
    metadata: dict[str, str | int | float | bool | None] | None


@dataclass(frozen=True)
class RoleAbilities:
    can_view: bool
    can_create: bool
    can_update: bool
    can_delete: bool


@dataclass(frozen=True)
class RoleInfo:
    role_id: str
    name: str
    abilities: RoleAbilities


class UserGateway(Protocol):
    def list_users(self, access_token: str | None) -> list[UserRecord]: ...


class RoleGateway(Protocol):
    def list_roles(self, access_token: str | None) -> list[RoleRecord]: ...

    def get_role(self, role_ref: str, access_token: str | None) -> RoleInfo | None: ...


class AuditGateway(Protocol):
    def list_logs(
        self, access_token: str | None, occurred_after: datetime | None
    ) -> list[AuditRecord]: ...
