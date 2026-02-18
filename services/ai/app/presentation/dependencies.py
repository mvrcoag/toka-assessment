from dataclasses import dataclass
from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Header, HTTPException

from ..application.ports.auth import AccessTokenClaims
from ..application.use_cases.ingest_embeddings import IngestEmbeddingsUseCase
from ..application.use_cases.query_agent import QueryAgentUseCase
from ..core.config import Settings
from ..domain.source import SourceType
from ..infrastructure.auth.jwt_verifier import JwtAccessTokenVerifier
from ..infrastructure.chroma.cursor_store import ChromaCursorStore
from ..infrastructure.chroma.vector_store import ChromaVectorStore
from ..infrastructure.http.service_clients import (
    AuditServiceClient,
    RoleServiceClient,
    UserServiceClient,
)
from ..infrastructure.openai.client import OpenAIChatClient, OpenAIEmbeddingClient
from ..infrastructure.rabbitmq.event_bus import RabbitMqEventBus


@dataclass(frozen=True)
class AuthContext:
    token: str
    claims: AccessTokenClaims


@lru_cache
def get_settings() -> Settings:
    return Settings.from_env()


@lru_cache
def get_token_verifier() -> JwtAccessTokenVerifier:
    return JwtAccessTokenVerifier(get_settings())


@lru_cache
def get_event_bus() -> RabbitMqEventBus:
    return RabbitMqEventBus(get_settings())


def get_auth_context(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthContext:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    try:
        claims = get_token_verifier().verify(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return AuthContext(token=authorization, claims=claims)


def require_create_permission(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthContext:
    abilities = auth.claims.role_abilities
    if abilities and abilities.can_create is True:
        return auth
    if abilities and abilities.can_create is False:
        raise HTTPException(status_code=403, detail="Insufficient role permissions")

    role_client = RoleServiceClient(settings)
    try:
        role = role_client.get_role(auth.claims.role, auth.token)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    if not role or not role.abilities.can_create:
        raise HTTPException(status_code=403, detail="Insufficient role permissions")
    return auth


def get_ingest_use_case(
    settings: Annotated[Settings, Depends(get_settings)],
    event_bus: Annotated[RabbitMqEventBus, Depends(get_event_bus)],
) -> IngestEmbeddingsUseCase:
    return IngestEmbeddingsUseCase(
        users=UserServiceClient(settings),
        roles=RoleServiceClient(settings),
        audit=AuditServiceClient(settings),
        embeddings=OpenAIEmbeddingClient(settings),
        vector_store=ChromaVectorStore(settings),
        cursor_store=ChromaCursorStore(settings),
        event_bus=event_bus,
    )


def get_query_use_case(
    settings: Annotated[Settings, Depends(get_settings)],
    event_bus: Annotated[RabbitMqEventBus, Depends(get_event_bus)],
) -> QueryAgentUseCase:
    return QueryAgentUseCase(
        embeddings=OpenAIEmbeddingClient(settings),
        chat=OpenAIChatClient(settings),
        vector_store=ChromaVectorStore(settings),
        event_bus=event_bus,
    )


def get_sources_or_default(sources: list[SourceType] | None) -> list[SourceType]:
    if sources:
        return sources
    return [SourceType.users, SourceType.roles, SourceType.audit]
