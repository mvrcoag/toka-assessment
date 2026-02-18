# Arquitectura del sistema

Este diagrama resume los componentes y sus relaciones principales.

```mermaid
flowchart LR
  subgraph Edge
    FE[Frontend]
    KONG[Kong Gateway]
  end

  subgraph Servicios
    AUTH[Auth]
    USER[User]
    ROLE[Role]
    AUDIT[Audit]
    AI[AI Service]
  end

  subgraph Datos
    PG[(PostgreSQL)]
    MONGO[(MongoDB)]
    REDIS[(Redis)]
    RMQ[(RabbitMQ)]
    CHROMA[(ChromaDB)]
  end

  subgraph Externo
    OAI[(OpenAI API)]
  end

  FE -->|HTTP| KONG
  KONG --> AUTH
  KONG --> USER
  KONG --> ROLE
  KONG --> AUDIT
  KONG --> AI

  AUTH --> PG
  AUTH --> REDIS
  AUTH --> RMQ

  USER --> PG
  USER --> RMQ
  USER -->|consulta| ROLE

  ROLE --> PG
  ROLE --> RMQ

  AUDIT --> MONGO
  AUDIT --> RMQ

  AI --> RMQ
  AI --> CHROMA
  AI --> OAI
  AI --> USER
  AI --> ROLE
  AI --> AUDIT
```

Notas de flujo:
- Kong centraliza el acceso y enruta a cada microservicio.
- Auth emite tokens y publica eventos de seguridad/auditoría.
- User y Role publican eventos de dominio hacia RabbitMQ.
- Audit consume eventos y persiste en MongoDB.
- AI consume datos de servicios internos y usa ChromaDB + OpenAI.
