from datetime import datetime
from typing import Protocol

from ...domain.source import SourceType


class CursorStore(Protocol):
    def get_cursor(self, source: SourceType) -> datetime | None: ...

    def set_cursor(self, source: SourceType, cursor: datetime) -> None: ...
