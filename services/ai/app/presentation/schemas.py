from pydantic import BaseModel, Field

from ..domain.source import SourceType


class IngestRequest(BaseModel):
    sources: list[SourceType] | None = None
    max_items: int | None = Field(default=None, ge=1, le=1000)


class IngestResponse(BaseModel):
    ingested: dict[str, int]
    cursors: dict[str, str | None]


class QueryRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    top_k: int = Field(default=5, ge=1, le=10)


class QuerySource(BaseModel):
    doc_id: str
    source: str | None
    metadata: dict[str, str | int | float | bool | None]
    distance: float | None


class QueryResponse(BaseModel):
    answer: str
    sources: list[QuerySource]
