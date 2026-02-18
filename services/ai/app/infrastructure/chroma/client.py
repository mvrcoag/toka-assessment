from urllib.parse import urlparse

import chromadb

from ...core.config import Settings


def build_chroma_client(settings: Settings) -> chromadb.HttpClient:
    parsed = urlparse(settings.chroma_url)
    host = parsed.hostname or "chromadb"
    port = parsed.port or 8000
    return chromadb.HttpClient(host=host, port=port)
