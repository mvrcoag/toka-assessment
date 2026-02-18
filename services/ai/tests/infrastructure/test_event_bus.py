import json

from app.core.config import Settings
from app.infrastructure.rabbitmq import event_bus


class StubChannel:
    def __init__(self) -> None:
        self.exchange_calls = []
        self.publish_calls = []
        self.closed = False

    def exchange_declare(self, **kwargs) -> None:
        self.exchange_calls.append(kwargs)

    def basic_publish(self, **kwargs) -> None:
        self.publish_calls.append(kwargs)

    def close(self) -> None:
        self.closed = True


class StubConnection:
    def __init__(self, params) -> None:
        self.params = params
        self.channel_obj = StubChannel()
        self.closed = False

    def channel(self):
        return self.channel_obj

    def close(self) -> None:
        self.closed = True


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


def test_publish_sends_envelope(monkeypatch) -> None:
    connection = StubConnection("params")
    monkeypatch.setattr(event_bus.pika, "BlockingConnection", lambda params: connection)

    bus = event_bus.RabbitMqEventBus(build_settings())
    bus.publish("AiIngested", {"k": "v"})

    assert connection.channel_obj.exchange_calls[0]["exchange"] == "events"
    assert connection.channel_obj.publish_calls
    payload = json.loads(connection.channel_obj.publish_calls[0]["body"])
    assert payload["name"] == "AiIngested"
    assert payload["payload"] == {"k": "v"}
    assert payload["occurredAt"]
    assert connection.closed is True


def test_to_routing_key() -> None:
    assert event_bus._to_routing_key("AiIngested") == "ai.ingested"
    assert event_bus._to_routing_key("ai ingested") == "ai.ingested"
