from typing import Protocol


class EventBus(Protocol):
    def publish(self, name: str, payload: dict) -> None: ...
