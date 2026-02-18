from datetime import datetime

from chromadb.api.models.Collection import Collection

from ...application.ports.cursor_store import CursorStore
from ...core.config import Settings
from ...domain.source import SourceType
from .client import build_chroma_client


class ChromaCursorStore(CursorStore):
    def __init__(self, settings: Settings) -> None:
        self.client = build_chroma_client(settings)
        self.collection: Collection = self.client.get_or_create_collection(
            name=settings.chroma_cursor_collection,
            metadata={"hnsw:space": "cosine"},
        )

    def get_cursor(self, source: SourceType) -> datetime | None:
        result = self.collection.get(ids=[source.value], include=["metadatas"])
        metadatas = result.get("metadatas")
        if not metadatas:
            return None
        metadata = metadatas[0] or {}
        value = metadata.get("cursor")
        if not value:
            return None
        return _parse_datetime(value)

    def set_cursor(self, source: SourceType, cursor: datetime) -> None:
        self.collection.upsert(
            ids=[source.value],
            embeddings=[[0.0]],
            documents=["cursor"],
            metadatas=[{"cursor": cursor.isoformat()}],
        )


def _parse_datetime(value: str) -> datetime | None:
    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None
