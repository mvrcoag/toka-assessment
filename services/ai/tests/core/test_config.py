from app.core.config import Settings


def test_from_env_defaults(monkeypatch) -> None:
    keys = [
        "OPENAI_API_KEY",
        "OPENAI_CHAT_MODEL",
        "OPENAI_EMBEDDING_MODEL",
        "CHROMA_URL",
        "CHROMA_COLLECTION",
        "CHROMA_CURSOR_COLLECTION",
        "AUTH_JWKS_URL",
        "AUTH_ISSUER",
        "USER_SERVICE_URL",
        "ROLE_SERVICE_URL",
        "AUDIT_SERVICE_URL",
        "RABBITMQ_URL",
        "RABBITMQ_EXCHANGE",
        "REQUEST_TIMEOUT_SECONDS",
        "EMBEDDING_BATCH_SIZE",
    ]
    for key in keys:
        monkeypatch.delenv(key, raising=False)

    settings = Settings.from_env()

    assert settings.openai_api_key is None
    assert settings.openai_chat_model == "gpt-4o-mini"
    assert settings.openai_embedding_model == "text-embedding-3-small"
    assert settings.chroma_url == "http://chromadb:8000"
    assert settings.chroma_collection == "toka-knowledge"
    assert settings.chroma_cursor_collection == "toka-cursors"
    assert settings.auth_jwks_url == "http://kong:8000/auth/.well-known/jwks.json"
    assert settings.auth_issuer == "http://localhost:8000/auth"
    assert settings.user_service_url == "http://user:3002/users"
    assert settings.role_service_url == "http://role:3003/roles"
    assert settings.audit_service_url == "http://audit:3004/logs"
    assert settings.rabbitmq_url == "amqp://toka:toka_password@rabbitmq:5672"
    assert settings.rabbitmq_exchange == "toka.events"
    assert settings.request_timeout_seconds == 10.0
    assert settings.max_batch_size == 128


def test_from_env_overrides(monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "key")
    monkeypatch.setenv("OPENAI_CHAT_MODEL", "gpt-test")
    monkeypatch.setenv("OPENAI_EMBEDDING_MODEL", "embed-test")
    monkeypatch.setenv("CHROMA_URL", "http://example:9999")
    monkeypatch.setenv("CHROMA_COLLECTION", "collection")
    monkeypatch.setenv("CHROMA_CURSOR_COLLECTION", "cursor")
    monkeypatch.setenv("AUTH_JWKS_URL", "https://auth/jwks")
    monkeypatch.setenv("AUTH_ISSUER", "https://issuer")
    monkeypatch.setenv("USER_SERVICE_URL", "https://users")
    monkeypatch.setenv("ROLE_SERVICE_URL", "https://roles")
    monkeypatch.setenv("AUDIT_SERVICE_URL", "https://audit")
    monkeypatch.setenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
    monkeypatch.setenv("RABBITMQ_EXCHANGE", "events")
    monkeypatch.setenv("REQUEST_TIMEOUT_SECONDS", "3.5")
    monkeypatch.setenv("EMBEDDING_BATCH_SIZE", "64")

    settings = Settings.from_env()

    assert settings.openai_api_key == "key"
    assert settings.openai_chat_model == "gpt-test"
    assert settings.openai_embedding_model == "embed-test"
    assert settings.chroma_url == "http://example:9999"
    assert settings.chroma_collection == "collection"
    assert settings.chroma_cursor_collection == "cursor"
    assert settings.auth_jwks_url == "https://auth/jwks"
    assert settings.auth_issuer == "https://issuer"
    assert settings.user_service_url == "https://users"
    assert settings.role_service_url == "https://roles"
    assert settings.audit_service_url == "https://audit"
    assert settings.rabbitmq_url == "amqp://guest:guest@localhost:5672"
    assert settings.rabbitmq_exchange == "events"
    assert settings.request_timeout_seconds == 3.5
    assert settings.max_batch_size == 64
