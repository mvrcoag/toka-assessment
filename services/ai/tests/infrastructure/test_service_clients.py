from datetime import datetime, timezone
from urllib.parse import parse_qs, urlparse

import pytest

from app.core.config import Settings
from app.infrastructure.http import service_clients


class StubResponse:
    def __init__(self, status_code, payload=None, text="") -> None:
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self):
        if isinstance(self._payload, Exception):
            raise self._payload
        return self._payload


class StubClient:
    def __init__(self, responses) -> None:
        self.responses = list(responses)
        self.calls = []

    def get(self, url, headers=None):
        self.calls.append((url, headers))
        return self.responses.pop(0)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


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


def test_user_service_client_parses_users(monkeypatch) -> None:
    payload = [
        {
            "id": "u1",
            "name": "Ada",
            "email": "ada@example.com",
            "roleId": "role-1",
            "roleName": "Admin",
            "createdAt": "2024-01-01T00:00:00Z",
        }
    ]
    response = StubResponse(200, payload)
    client = StubClient([response])
    monkeypatch.setattr(service_clients.httpx, "Client", lambda timeout: client)

    users = service_clients.UserServiceClient(build_settings()).list_users("token")

    assert users[0].user_id == "u1"
    assert users[0].role_id == "role-1"
    assert users[0].role_name == "Admin"
    assert users[0].created_at.isoformat() == "2024-01-01T00:00:00+00:00"
    assert client.calls[0][1]["Authorization"] == "token"


def test_role_service_client_get_role_by_uuid_handles_404(monkeypatch) -> None:
    response = StubResponse(404, {"message": "missing"})
    client = StubClient([response])
    monkeypatch.setattr(service_clients.httpx, "Client", lambda timeout: client)

    role = service_clients.RoleServiceClient(build_settings()).get_role(
        "123e4567-e89b-12d3-a456-426614174000",
        "token",
    )

    assert role is None


def test_role_service_client_get_role_by_uuid_returns_role(monkeypatch) -> None:
    payload = {
        "id": "role-1",
        "name": "Admin",
        "abilities": {
            "canView": True,
            "canCreate": True,
            "canUpdate": False,
            "canDelete": False,
        },
    }
    response = StubResponse(200, payload)
    client = StubClient([response])
    monkeypatch.setattr(service_clients.httpx, "Client", lambda timeout: client)

    role = service_clients.RoleServiceClient(build_settings()).get_role(
        "123e4567-e89b-12d3-a456-426614174000",
        "token",
    )

    assert role.name == "Admin"
    assert role.abilities.can_create is True


def test_role_service_client_get_role_by_name(monkeypatch) -> None:
    payload = [
        {
            "id": "role-1",
            "name": "Admin",
            "abilities": {
                "canView": True,
                "canCreate": True,
                "canUpdate": False,
                "canDelete": False,
            },
        }
    ]
    response = StubResponse(200, payload)
    client = StubClient([response])
    monkeypatch.setattr(service_clients.httpx, "Client", lambda timeout: client)

    role = service_clients.RoleServiceClient(build_settings()).get_role(
        "admin", "token"
    )

    assert role.role_id == "role-1"
    assert role.name == "Admin"


def test_audit_service_client_includes_from_param(monkeypatch) -> None:
    response = StubResponse(200, [])
    client = StubClient([response])
    monkeypatch.setattr(service_clients.httpx, "Client", lambda timeout: client)

    occurred_after = datetime(2024, 1, 1, tzinfo=timezone.utc)
    service_clients.AuditServiceClient(build_settings()).list_logs(
        "token", occurred_after
    )

    url = client.calls[0][0]
    params = parse_qs(urlparse(url).query)
    assert params["from"][0] == "2024-01-01T00:00:00+00:00"


def test_parse_datetime_variants() -> None:
    parsed = service_clients._parse_datetime("2024-01-01T00:00:00Z")
    assert parsed.isoformat() == "2024-01-01T00:00:00+00:00"
    assert service_clients._parse_datetime(None) is None
    assert service_clients._parse_datetime("invalid") is None
    now = datetime(2024, 1, 1, tzinfo=timezone.utc)
    assert service_clients._parse_datetime(now) == now


def test_looks_like_uuid() -> None:
    assert service_clients._looks_like_uuid("123e4567-e89b-12d3-a456-426614174000")
    assert not service_clients._looks_like_uuid("not-a-uuid")


def test_error_message_from_response() -> None:
    response = StubResponse(500, {"error": "boom"})
    assert (
        service_clients._error_message("users", response)
        == "users service error (500): boom"
    )

    response = StubResponse(400, ValueError("bad"), text="fallback")
    assert (
        service_clients._error_message("roles", response)
        == "roles service error (400): fallback"
    )


def test_service_client_raises_for_error_status(monkeypatch) -> None:
    response = StubResponse(500, {"message": "down"})
    client = StubClient([response])
    monkeypatch.setattr(service_clients.httpx, "Client", lambda timeout: client)

    with pytest.raises(RuntimeError) as exc:
        service_clients.UserServiceClient(build_settings()).list_users("token")

    assert "users service error" in str(exc.value)
