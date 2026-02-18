from jwt import PyJWKClient, decode
from jwt import InvalidTokenError

from ...core.config import Settings
from ...application.ports.auth import (
    AccessTokenClaims,
    AccessTokenVerifier,
    RoleAbilitiesClaims,
)


class JwtAccessTokenVerifier(AccessTokenVerifier):
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.jwks_client = PyJWKClient(settings.auth_jwks_url)

    def verify(self, token: str) -> AccessTokenClaims:
        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            payload = decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=self.settings.auth_issuer,
                options={"verify_aud": False},
            )
        except InvalidTokenError as exc:
            raise ValueError("Invalid access token") from exc

        role_value = (
            payload.get("roleId") or payload.get("role_id") or payload.get("role")
        )
        role_abilities_payload = payload.get("roleAbilities") or payload.get(
            "role_abilities"
        )
        required = ["sub", "email", "name"]
        for field in required:
            if field not in payload or not payload.get(field):
                raise ValueError("Access token missing required claims")
        if not role_value:
            raise ValueError("Access token missing required claims")

        return AccessTokenClaims(
            sub=str(payload.get("sub")),
            email=str(payload.get("email")),
            name=str(payload.get("name")),
            role=str(role_value),
            role_abilities=_to_role_abilities(role_abilities_payload),
            scope=str(payload.get("scope")) if payload.get("scope") else None,
            client_id=str(payload.get("clientId")) if payload.get("clientId") else None,
        )


def _to_role_abilities(payload: object) -> RoleAbilitiesClaims | None:
    if not isinstance(payload, dict):
        return None
    return RoleAbilitiesClaims(
        can_view=_to_bool(payload.get("canView")),
        can_create=_to_bool(payload.get("canCreate")),
        can_update=_to_bool(payload.get("canUpdate")),
        can_delete=_to_bool(payload.get("canDelete")),
    )


def _to_bool(value: object) -> bool | None:
    if value is None:
        return None
    return bool(value)
