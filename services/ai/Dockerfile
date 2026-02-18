FROM python:3.14-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

COPY pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir \
    "fastapi[standard]>=0.129.0" \
    "chromadb>=1.1.0" \
    "httpx>=0.28.1" \
    "openai>=1.108.0" \
    "pyjwt[crypto]>=2.10.1"

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
