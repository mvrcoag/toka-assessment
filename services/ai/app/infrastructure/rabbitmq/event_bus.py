from dataclasses import dataclass
from datetime import datetime, timezone
import json
import logging

import pika

from ...application.ports.event_bus import EventBus
from ...core.config import Settings


@dataclass(frozen=True)
class EventEnvelope:
    name: str
    occurred_at: str
    payload: dict


class RabbitMqEventBus(EventBus):
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.logger = logging.getLogger(__name__)

    def publish(self, name: str, payload: dict) -> None:
        envelope = EventEnvelope(
            name=name,
            occurred_at=datetime.now(timezone.utc).isoformat(),
            payload=payload,
        )
        try:
            connection = pika.BlockingConnection(
                pika.URLParameters(self.settings.rabbitmq_url)
            )
            channel = connection.channel()
            channel.exchange_declare(
                exchange=self.settings.rabbitmq_exchange,
                exchange_type="topic",
                durable=True,
            )
            channel.basic_publish(
                exchange=self.settings.rabbitmq_exchange,
                routing_key=_to_routing_key(name),
                body=json.dumps(
                    {
                        "name": envelope.name,
                        "occurredAt": envelope.occurred_at,
                        "payload": envelope.payload,
                    }
                ),
                properties=pika.BasicProperties(content_type="application/json"),
            )
            channel.close()
            connection.close()
        except Exception as exc:  # pragma: no cover
            self.logger.warning("RabbitMQ publish failed", exc_info=exc)


def _to_routing_key(name: str) -> str:
    chars: list[str] = []
    for index, ch in enumerate(name):
        if ch.isupper() and index != 0 and name[index - 1].islower():
            chars.append(".")
        chars.append(ch.lower())
    return "".join(chars).replace(" ", ".")
