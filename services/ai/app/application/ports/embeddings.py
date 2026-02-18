from typing import Protocol


class EmbeddingClient(Protocol):
    def embed_texts(self, inputs: list[str]) -> list[list[float]]: ...


class ChatClient(Protocol):
    def generate(self, system_prompt: str, user_prompt: str) -> str: ...
