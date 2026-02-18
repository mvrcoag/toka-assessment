import pytest
from fastapi import HTTPException

from app.application.ports.auth import AccessTokenClaims, RoleAbilitiesClaims
from app.application.ports.sources import RoleAbilities, RoleInfo
from app.core.config import Settings
from app.domain.source import SourceType
from app.presentation import dependencies
from app.presentation.dependencies import AuthContext


class StubVerifier:
    def __init__(self, claims) -> None:
        self.claims = claims
        self.last_token = None

    def verify(self, token):
        self.last_token = token
        return self.claims


def build_settings() -> Settings:
    return Settings(
        openai_api_key=None,
        openai_chat_model="gpt",
        openai_embedding_model="embed",
        chroma_url="http://chroma",
        chroma_collection="collection",
        chroma_cursor_collection="cursor",
        auth_jwks_url="https://jwks",
        auth_issuer="https://issuer",
        user_service_url="https://users",
        role_service_url="https://roles",
        audit_service_url="https://audit",
        rabbitmq_url="amqp://guest:guest@localhost:5672",
        rabbitmq_exchange="events",
        request_timeout_seconds=1.0,
        max_batch_size=10,
    )


def build_claims(can_create) -> AccessTokenClaims:
    abilities = None
    if can_create is not None:
        abilities = RoleAbilitiesClaims(can_create=can_create)
    return AccessTokenClaims(
        sub="user",
        email="user@example.com",
        name="User",
        role="admin",
        role_abilities=abilities,
        scope=None,
        client_id=None,
    )


def test_get_sources_or_default() -> None:
    assert dependencies.get_sources_or_default(None) == [
        SourceType.users,
        SourceType.roles,
        SourceType.audit,
    ]
    assert dependencies.get_sources_or_default([]) == [
        SourceType.users,
        SourceType.roles,
        SourceType.audit,
    ]
    assert dependencies.get_sources_or_default([SourceType.users]) == [SourceType.users]


def test_get_auth_context_requires_header() -> None:
    with pytest.raises(HTTPException) as exc:
        dependencies.get_auth_context(None)
    assert exc.value.status_code == 401


def test_get_auth_context_rejects_empty_bearer() -> None:
    with pytest.raises(HTTPException) as exc:
        dependencies.get_auth_context("Bearer   ")
    assert exc.value.status_code == 401


def test_get_auth_context_verifies_token(monkeypatch) -> None:
    claims = build_claims(True)
    verifier = StubVerifier(claims)
    monkeypatch.setattr(dependencies, "get_token_verifier", lambda: verifier)

    result = dependencies.get_auth_context("Bearer token")

    assert result.claims == claims
    assert result.token == "Bearer token"
    assert verifier.last_token == "token"


def test_get_auth_context_rejects_invalid_token(monkeypatch) -> None:
    class StubInvalidVerifier:
        def verify(self, token):
            raise ValueError("invalid")

    monkeypatch.setattr(
        dependencies, "get_token_verifier", lambda: StubInvalidVerifier()
    )

    with pytest.raises(HTTPException) as exc:
        dependencies.get_auth_context("Bearer token")
    assert exc.value.status_code == 401


def test_require_create_permission_uses_claims() -> None:
    auth = AuthContext(token="Bearer token", claims=build_claims(True))
    settings = build_settings()

    assert dependencies.require_create_permission(auth, settings) == auth


def test_require_create_permission_denies_claims() -> None:
    auth = AuthContext(token="Bearer token", claims=build_claims(False))
    settings = build_settings()

    with pytest.raises(HTTPException) as exc:
        dependencies.require_create_permission(auth, settings)
    assert exc.value.status_code == 403


def test_require_create_permission_checks_role_service(monkeypatch) -> None:
    class StubRoleClient:
        def __init__(self, settings) -> None:
            self.settings = settings

        def get_role(self, role_ref, access_token):
            return RoleInfo(
                role_id="role-1",
                name="Admin",
                abilities=RoleAbilities(
                    can_view=True,
                    can_create=True,
                    can_update=False,
                    can_delete=False,
                ),
            )

    monkeypatch.setattr(dependencies, "RoleServiceClient", StubRoleClient)

    auth = AuthContext(token="Bearer token", claims=build_claims(None))
    settings = build_settings()

    assert dependencies.require_create_permission(auth, settings) == auth


def test_require_create_permission_denies_role_service(monkeypatch) -> None:
    class StubRoleClient:
        def __init__(self, settings) -> None:
            self.settings = settings

        def get_role(self, role_ref, access_token):
            return RoleInfo(
                role_id="role-1",
                name="Admin",
                abilities=RoleAbilities(
                    can_view=True,
                    can_create=False,
                    can_update=False,
                    can_delete=False,
                ),
            )

    monkeypatch.setattr(dependencies, "RoleServiceClient", StubRoleClient)

    auth = AuthContext(token="Bearer token", claims=build_claims(None))
    settings = build_settings()

    with pytest.raises(HTTPException) as exc:
        dependencies.require_create_permission(auth, settings)
    assert exc.value.status_code == 403


def test_require_create_permission_denies_missing_role(monkeypatch) -> None:
    class StubRoleClient:
        def __init__(self, settings) -> None:
            self.settings = settings

        def get_role(self, role_ref, access_token):
            return None

    monkeypatch.setattr(dependencies, "RoleServiceClient", StubRoleClient)

    auth = AuthContext(token="Bearer token", claims=build_claims(None))
    settings = build_settings()

    with pytest.raises(HTTPException) as exc:
        dependencies.require_create_permission(auth, settings)
    assert exc.value.status_code == 403


def test_require_create_permission_handles_role_service_errors(monkeypatch) -> None:
    class StubRoleClient:
        def __init__(self, settings) -> None:
            self.settings = settings

        def get_role(self, role_ref, access_token):
            raise RuntimeError("boom")

    monkeypatch.setattr(dependencies, "RoleServiceClient", StubRoleClient)

    auth = AuthContext(token="Bearer token", claims=build_claims(None))
    settings = build_settings()

    with pytest.raises(HTTPException) as exc:
        dependencies.require_create_permission(auth, settings)
    assert exc.value.status_code == 502
