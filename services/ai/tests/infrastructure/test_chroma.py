from datetime import datetime, timezone

from app.core.config import Settings
from app.domain.source import SourceType
from app.infrastructure.chroma import client as chroma_client
from app.infrastructure.chroma import cursor_store, vector_store
from app.domain.document import EmbeddingDocument


class StubCollection:
    def __init__(self) -> None:
        self.upsert_calls = []
        self.query_result = {}
        self.get_result = {}

    def upsert(self, **kwargs) -> None:
        self.upsert_calls.append(kwargs)

    def query(self, **kwargs):
        return self.query_result

    def get(self, **kwargs):
        return self.get_result


class StubClient:
    def __init__(self, collection) -> None:
        self.collection = collection

    def get_or_create_collection(self, name, metadata):
        return self.collection


def build_settings(url="http://example:1234") -> Settings:
    return Settings(
        openai_api_key=None,
        openai_chat_model="gpt",
        openai_embedding_model="embed",
        chroma_url=url,
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


def test_build_chroma_client_parses_url(monkeypatch) -> None:
    called = {}

    def fake_http_client(host, port):
        called["host"] = host
        called["port"] = port
        return "client"

    monkeypatch.setattr(chroma_client.chromadb, "HttpClient", fake_http_client)

    result = chroma_client.build_chroma_client(build_settings("http://db:9999"))

    assert result == "client"
    assert called == {"host": "db", "port": 9999}


def test_chroma_vector_store_upsert_and_query(monkeypatch) -> None:
    collection = StubCollection()
    collection.query_result = {
        "documents": [["doc1"]],
        "metadatas": [[{"source": "users"}]],
        "distances": [[0.1]],
        "ids": [[]],
    }
    client = StubClient(collection)
    monkeypatch.setattr(vector_store, "build_chroma_client", lambda settings: client)

    store = vector_store.ChromaVectorStore(build_settings())
    docs = [
        EmbeddingDocument(
            doc_id="doc-1",
            content="User",
            metadata={"source": "users"},
        )
    ]
    store.upsert(docs, [[0.1]])
    results = store.query([0.1], 1)

    assert collection.upsert_calls[0]["ids"] == ["doc-1"]
    assert results[0].doc_id == "doc-0"
    assert results[0].metadata["source"] == "users"


def test_chroma_cursor_store_get_and_set(monkeypatch) -> None:
    collection = StubCollection()
    collection.get_result = {"metadatas": [{"cursor": "2024-01-01T00:00:00Z"}]}
    client = StubClient(collection)
    monkeypatch.setattr(cursor_store, "build_chroma_client", lambda settings: client)

    store = cursor_store.ChromaCursorStore(build_settings())
    cursor = store.get_cursor(SourceType.users)
    store.set_cursor(SourceType.users, datetime(2024, 1, 2, tzinfo=timezone.utc))

    assert cursor.isoformat() == "2024-01-01T00:00:00+00:00"
    assert collection.upsert_calls[0]["ids"] == ["users"]
    assert collection.upsert_calls[0]["documents"] == ["cursor"]


def test_parse_datetime_invalid() -> None:
    assert cursor_store._parse_datetime("invalid") is None
