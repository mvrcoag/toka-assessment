from dataclasses import dataclass


@dataclass(frozen=True)
class EmbeddingDocument:
    doc_id: str
    content: str
    metadata: dict[str, str | int | float | bool | None]
