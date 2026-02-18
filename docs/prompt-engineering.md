# Estado actual de prompt engineering

Objetivo:
- Respuestas consistentes basadas solo en contexto recuperado, con costos controlados.

Implementación actual:
- RAG básico: embedding de la pregunta y búsqueda en ChromaDB (top_k).
- Contexto concatenado en texto simple y enviado al modelo.
- System prompt fijo en inglés, sin plantillas por caso de uso.
- Respuestas sin validación de formato ni post-procesamiento.
- Publicación de evento `AiQueried` para trazabilidad básica.

Limitaciones actuales:
- Sin defensa explícita ante prompt injection (solo instrucción de usar contexto).
- Sin reranking ni resumen de contexto.
- Sin control dinámico de modelo por criticidad.
- Sin cache de respuestas ni memoria conversacional.

System prompt vigente (resumen):
- Asistente de operaciones que responde solo con el contexto provisto.
- Si falta información, debe indicarlo.

Mejoras sugeridas (futuras):
- Plantillas por tipo de tarea y idioma configurable.
- Resumen y normalización del contexto (top_k adaptativo).
- Guardrails de seguridad y validación de salida.
- Métricas de tokens/latencia por endpoint y alertas.
