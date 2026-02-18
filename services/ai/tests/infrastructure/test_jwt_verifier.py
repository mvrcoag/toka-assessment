import pytest
from jwt import InvalidTokenError

from app.core.config import Settings
from app.infrastructure.auth import jwt_verifier


class StubSigningKey:
    def __init__(self, key) -> None:
        self.key = key


class StubJwksClient:
    def __init__(self, url) -> None:
        self.url = url

    def get_signing_key_from_jwt(self, token):
        return StubSigningKey("secret")


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


def test_verify_returns_claims(monkeypatch) -> None:
    payload = {
        "sub": "user",
        "email": "user@example.com",
        "name": "User",
        "role": "admin",
        "roleAbilities": {"canView": True, "canCreate": False},
    }
    monkeypatch.setattr(jwt_verifier, "PyJWKClient", StubJwksClient)
    monkeypatch.setattr(jwt_verifier, "decode", lambda *args, **kwargs: payload)

    verifier = jwt_verifier.JwtAccessTokenVerifier(build_settings())
    claims = verifier.verify("token")

    assert claims.sub == "user"
    assert claims.role == "admin"
    assert claims.role_abilities.can_view is True
    assert claims.role_abilities.can_create is False


def test_verify_rejects_missing_claims(monkeypatch) -> None:
    payload = {"sub": "user", "email": "user@example.com", "name": "User"}
    monkeypatch.setattr(jwt_verifier, "PyJWKClient", StubJwksClient)
    monkeypatch.setattr(jwt_verifier, "decode", lambda *args, **kwargs: payload)

    verifier = jwt_verifier.JwtAccessTokenVerifier(build_settings())

    with pytest.raises(ValueError):
        verifier.verify("token")


def test_verify_rejects_invalid_token(monkeypatch) -> None:
    def raise_invalid(*args, **kwargs):
        raise InvalidTokenError("bad")

    monkeypatch.setattr(jwt_verifier, "PyJWKClient", StubJwksClient)
    monkeypatch.setattr(jwt_verifier, "decode", raise_invalid)

    verifier = jwt_verifier.JwtAccessTokenVerifier(build_settings())

    with pytest.raises(ValueError):
        verifier.verify("token")


def test_to_role_abilities_handles_invalid_payload() -> None:
    assert jwt_verifier._to_role_abilities("nope") is None
    assert jwt_verifier._to_bool(None) is None
