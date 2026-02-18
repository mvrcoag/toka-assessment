from dataclasses import dataclass
from typing import Protocol

from ...domain.document import EmbeddingDocument


@dataclass(frozen=True)
class RetrievedDocument:
    doc_id: str
    content: str
    metadata: dict[str, str | int | float | bool | None]
    distance: float | None


class VectorStore(Protocol):
    def upsert(
        self, documents: list[EmbeddingDocument], embeddings: list[list[float]]
    ) -> None: ...

    def query(self, embedding: list[float], top_k: int) -> list[RetrievedDocument]: ...
