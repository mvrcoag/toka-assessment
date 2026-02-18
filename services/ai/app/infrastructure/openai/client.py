from openai import OpenAI

from ...application.ports.embeddings import ChatClient, EmbeddingClient
from ...core.config import Settings


class OpenAIEmbeddingClient(EmbeddingClient):
    def __init__(self, settings: Settings) -> None:
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required")
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_embedding_model
        self.max_batch_size = settings.max_batch_size

    def embed_texts(self, inputs: list[str]) -> list[list[float]]:
        embeddings: list[list[float]] = []
        for start in range(0, len(inputs), self.max_batch_size):
            batch = inputs[start : start + self.max_batch_size]
            response = self.client.embeddings.create(model=self.model, input=batch)
            embeddings.extend([item.embedding for item in response.data])
        return embeddings


class OpenAIChatClient(ChatClient):
    def __init__(self, settings: Settings) -> None:
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required")
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_chat_model

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        message = response.choices[0].message
        return message.content or ""
