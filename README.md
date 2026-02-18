# Toka Assessment

<center>

[![Ver video de ejecucion](https://img.youtube.com/vi/EDAU50khNVA/hqdefault.jpg)](https://www.youtube.com/watch?v=EDAU50khNVA)

<i>Mira este video para ver el paso a paso de como correr el proyecto.</i>

</center>

## Cómo usar el proyecto

Requisitos:
- Docker + Docker Compose

Configuración inicial:
1. `cp .env.example .env`
2. Configura los secretos obligatorios en `.env`.

Secretos obligatorios (Auth):
- `JWT_PRIVATE_KEY` y `JWT_PUBLIC_KEY`
- Generación local:
  ```bash
  openssl genpkey -algorithm RSA -out jwt-private.pem -pkeyopt rsa_keygen_bits:2048
  openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
  ```
- Para pegar en `.env` (una sola línea con `\n`):
  ```bash
  awk '{printf "%s\\n", $0}' jwt-private.pem
  awk '{printf "%s\\n", $0}' jwt-public.pem
  ```

Secretos opcionales:
- `OPENAI_API_KEY` (solo si vas a usar el servicio AI)

Pasos rápidos:
1. `docker compose up --build`
2. Gateway: `http://localhost:8000`
3. Frontend: `http://localhost:3000`

Test con coverage
- Ejecutar todo en Docker: `./scripts/run-tests-docker.sh`
- Reportes: Jest en `services/<service>/coverage/` y AI en `services/ai/coverage.xml`
- Coverage actual (ultima ejecucion en Docker):
- auth: 83.96%
- user: 76.76%
- role: 78.38%
- audit: 72.59%
- ai: 93.77%

### Evaluación básica de respuestas (AI)

Script standalone para medir latencia, costo de tokens (input/output) y validación básica de calidad:

```bash
docker compose exec ai python evaluate_responses.py --question "List roles" --top-k 5
```

Varias preguntas:

```bash
docker compose exec ai python evaluate_responses.py \
  --question "How many users exist?" \
  --question "Show recent audit activity"
```

Archivo de preguntas (`.txt` o `.json`):

```bash
docker compose exec ai python evaluate_responses.py --questions-file questions.txt
```

Coste por 1K tokens (opcional):

```bash
docker compose exec \
  -e OPENAI_INPUT_COST_PER_1K=0.00015 \
  -e OPENAI_OUTPUT_COST_PER_1K=0.00060 \
  ai python evaluate_responses.py --question "..."
```

Notas:
- Usa las mismas variables de entorno que el servicio AI (`OPENAI_API_KEY`, `CHROMA_URL`, etc.).
- Si `tiktoken` no está instalado, usa una estimación simple por caracteres.

Endpoints principales (via Kong):
- Auth (OIDC/OAuth2): `http://localhost:8000/auth/.well-known/openid-configuration`
- Roles: `http://localhost:8000/roles`
- Usuarios: `http://localhost:8000/users`
- Logs (audit): `http://localhost:8000/logs`

Notas de inicialización:
- Postgres y Mongo ejecutan scripts de init solo en el primer arranque (volumen vacío).
- Si ya existen datos y necesitas re-ejecutar init: `docker compose down -v && docker compose up --build`.

Usuarios por defecto (Postgres init):
- Email: `user@toka.local`
- Password: `toka-password`
- Rol: `admin`

## Estructura del proyecto

```
.
├── docker-compose.yml
├── kong/
│   └── kong.yml
├── postgres/
│   └── init/
├── mongodb/
│   └── init/
└── services/
    ├── auth/
    ├── user/
    ├── role/
    ├── audit/
    └── ai/
```

Cada servicio sigue la misma organizacion interna:

```
src/
├── domain/
├── application/
├── infrastructure/
└── presentation/
```

## Documentación adicional

- `docs/architecture.md`
- `docs/technical-justification.md`
- `docs/ddd-clean-architecture.md`
- `docs/docker-compose-design.md`
- `docs/prompt-engineering.md`
- `docs/performance-under-pressure.md`

## Justificación de decisiones técnicas

- NestJS: framework modular y consistente para microservicios HTTP y capas limpias.
- TypeORM: ORM flexible para Postgres y Mongo; facilita repositorios y entidades.
- Postgres 16: transaccional y consistente para usuarios/roles.
- MongoDB: flexible para logs con esquemas dinamicos.
- Redis: tokens revocados y estado temporal de auth.
- Kong (db-less): gateway simple, sin dependencia de DB, ideal para el alcance actual.
- RabbitMQ: mensajeria confiable para eventos de dominio y desacoplamiento.
- OAuth2/OIDC: estandar de autenticacion/autorizacion.
- Docker Compose: entorno reproducible para la prueba tecnica.

## Flujo de datos entre microservicios (resumen)

1) Auth emite JWTs (access/id/refresh).
2) User y Role validan el token con JWKS del auth (via Kong).
3) User y Role publican eventos de dominio en RabbitMQ (exchange `toka.events`).
4) Audit consume todos los eventos y los guarda como logs en MongoDB.

## DDD y Clean Architecture

- Domain: entidades, value objects y eventos (logica de negocio pura).
- Application: casos de uso y puertos (contratos).
- Infrastructure: adaptadores (ORM, RabbitMQ, Redis, JWT, etc.).
- Presentation: controllers, DTOs y validacion.
- Dependencias siempre apuntan hacia el dominio.

## Key points (para la prueba técnica)

- Arquitectura limpia por servicio con DDD.
- Autenticacion estandar OIDC/OAuth2.
- Gateway centralizado con Kong.
- Mensajeria asincrona con RabbitMQ.
- Persistencia poliglota (Postgres + Mongo + Redis).
- Tests unitarios con alta cobertura en servicios críticos.

## Particularidades por servicio

- Auth: servidor OAuth2/OIDC, login propio, JWKS y tokens; revocación en Redis y usuarios en Postgres.
- User: CRUD de usuarios, eventos de dominio publicados a RabbitMQ, persistencia en Postgres.
- Role: CRUD de roles y habilidades, eventos publicados a RabbitMQ, persistencia en Postgres.
- Audit: solo lectura HTTP; consume eventos desde RabbitMQ y guarda logs en MongoDB.
- AI: servicio FastAPI base para futuras capacidades de IA.
