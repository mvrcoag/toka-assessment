from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class RoleAbilitiesClaims:
    can_view: bool | None = None
    can_create: bool | None = None
    can_update: bool | None = None
    can_delete: bool | None = None


@dataclass(frozen=True)
class AccessTokenClaims:
    sub: str
    email: str
    name: str
    role: str
    role_abilities: RoleAbilitiesClaims | None
    scope: str | None
    client_id: str | None


class AccessTokenVerifier(Protocol):
    def verify(self, token: str) -> AccessTokenClaims: ...
