# Justificación técnica de tech stacks

Principios guía:
- Consistencia en microservicios: stack homogéneo para facilitar operación.
- Separación de responsabilidades: capas limpias y contratos explícitos.
- Observabilidad y resiliencia: integración con mensajería y gateway.
- Reproducibilidad: entorno local idéntico al de validación.

Tecnologías y razones:
- NestJS: framework modular con inyección de dependencias; se adapta bien a DDD y Clean Architecture.
- TypeORM: facilita repositorios y mapeo de entidades sin forzar el dominio a conocer la infraestructura.
- PostgreSQL 16: base transaccional sólida para usuarios/roles y consistencia fuerte.
- MongoDB: almacenamiento flexible para logs y eventos con esquema dinámico.
- Redis: revocación de tokens y estado temporal en autenticación.
- RabbitMQ: mensajería confiable para eventos de dominio y desacoplamiento.
- Kong (DB-less): gateway liviano, configuración declarativa y fácil de versionar.
- Docker Compose: orquestación reproducible para evaluación técnica.
- ChromaDB: vector store simple para embeddings y búsquedas semánticas.
- FastAPI (AI): servicio liviano y rápido para integración con modelos externos.
- OAuth2/OIDC: estándar de autenticación y autorización interoperable.
