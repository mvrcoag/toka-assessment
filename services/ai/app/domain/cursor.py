from dataclasses import dataclass
from datetime import datetime

from .source import SourceType


@dataclass(frozen=True)
class Cursor:
    source: SourceType
    last_seen: datetime
