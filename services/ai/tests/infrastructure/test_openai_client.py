import pytest

from app.core.config import Settings
from app.infrastructure.openai import client as openai_client


class StubEmbeddingItem:
    def __init__(self, embedding) -> None:
        self.embedding = embedding


class StubEmbeddingResponse:
    def __init__(self, data) -> None:
        self.data = data


class StubEmbeddings:
    def __init__(self) -> None:
        self.calls = []

    def create(self, model, input):
        self.calls.append((model, list(input)))
        data = [StubEmbeddingItem([float(index)]) for index, _ in enumerate(input)]
        return StubEmbeddingResponse(data)


class StubMessage:
    def __init__(self, content) -> None:
        self.content = content


class StubChoice:
    def __init__(self, content) -> None:
        self.message = StubMessage(content)


class StubChatResponse:
    def __init__(self, content) -> None:
        self.choices = [StubChoice(content)]


class StubChatCompletions:
    def __init__(self, content) -> None:
        self.content = content
        self.calls = []

    def create(self, model, messages, temperature):
        self.calls.append((model, messages, temperature))
        return StubChatResponse(self.content)


class StubChat:
    def __init__(self, content) -> None:
        self.completions = StubChatCompletions(content)


class StubOpenAI:
    def __init__(self, api_key) -> None:
        self.api_key = api_key
        self.embeddings = StubEmbeddings()
        self.chat = StubChat("ok")


class StubOpenAIEmpty(StubOpenAI):
    def __init__(self, api_key) -> None:
        super().__init__(api_key)
        self.chat = StubChat(None)


def build_settings(api_key="key") -> Settings:
    return Settings(
        openai_api_key=api_key,
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
        max_batch_size=2,
    )


def test_embedding_client_batches(monkeypatch) -> None:
    monkeypatch.setattr(openai_client, "OpenAI", StubOpenAI)

    client = openai_client.OpenAIEmbeddingClient(build_settings())
    embeddings = client.embed_texts(["a", "b", "c"])

    assert len(embeddings) == 3
    assert client.client.embeddings.calls[0][1] == ["a", "b"]
    assert client.client.embeddings.calls[1][1] == ["c"]


def test_chat_client_returns_message(monkeypatch) -> None:
    monkeypatch.setattr(openai_client, "OpenAI", StubOpenAI)

    client = openai_client.OpenAIChatClient(build_settings())
    result = client.generate("system", "user")

    assert result == "ok"


def test_chat_client_returns_empty_when_missing_content(monkeypatch) -> None:
    monkeypatch.setattr(openai_client, "OpenAI", StubOpenAIEmpty)

    client = openai_client.OpenAIChatClient(build_settings())
    result = client.generate("system", "user")

    assert result == ""


def test_openai_clients_require_api_key() -> None:
    with pytest.raises(ValueError):
        openai_client.OpenAIEmbeddingClient(build_settings(api_key=None))

    with pytest.raises(ValueError):
        openai_client.OpenAIChatClient(build_settings(api_key=None))
