from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    openai_api_key: str | None
    openai_chat_model: str
    openai_embedding_model: str
    chroma_url: str
    chroma_collection: str
    chroma_cursor_collection: str
    auth_jwks_url: str
    auth_issuer: str
    user_service_url: str
    role_service_url: str
    audit_service_url: str
    rabbitmq_url: str
    rabbitmq_exchange: str
    request_timeout_seconds: float
    max_batch_size: int

    @staticmethod
    def from_env() -> "Settings":
        return Settings(
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            openai_chat_model=os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
            openai_embedding_model=os.getenv(
                "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"
            ),
            chroma_url=os.getenv("CHROMA_URL", "http://chromadb:8000"),
            chroma_collection=os.getenv("CHROMA_COLLECTION", "toka-knowledge"),
            chroma_cursor_collection=os.getenv(
                "CHROMA_CURSOR_COLLECTION", "toka-cursors"
            ),
            auth_jwks_url=os.getenv(
                "AUTH_JWKS_URL", "http://kong:8000/auth/.well-known/jwks.json"
            ),
            auth_issuer=os.getenv("AUTH_ISSUER", "http://localhost:8000/auth"),
            user_service_url=os.getenv("USER_SERVICE_URL", "http://user:3002/users"),
            role_service_url=os.getenv("ROLE_SERVICE_URL", "http://role:3003/roles"),
            audit_service_url=os.getenv("AUDIT_SERVICE_URL", "http://audit:3004/logs"),
            rabbitmq_url=os.getenv(
                "RABBITMQ_URL", "amqp://toka:toka_password@rabbitmq:5672"
            ),
            rabbitmq_exchange=os.getenv("RABBITMQ_EXCHANGE", "toka.events"),
            request_timeout_seconds=float(os.getenv("REQUEST_TIMEOUT_SECONDS", "10")),
            max_batch_size=int(os.getenv("EMBEDDING_BATCH_SIZE", "128")),
        )
