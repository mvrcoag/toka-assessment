#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

run_node_tests() {
  local service="$1"
  echo "==> ${service}: npm run test:cov"
  docker run --rm \
    -e HOME=/tmp \
    -u "$(id -u):$(id -g)" \
    -v "${ROOT_DIR}/services/${service}:/app" \
    -w /app \
    node:24-slim \
    sh -c "npm ci && npm run test:cov"
}

run_python_tests() {
  local service="$1"
  echo "==> ${service}: pytest (coverage)"
  docker run --rm \
    -e HOME=/tmp \
    -e PIP_DISABLE_PIP_VERSION_CHECK=1 \
    -u "$(id -u):$(id -g)" \
    -v "${ROOT_DIR}/services/${service}:/app" \
    -w /app \
    python:3.12-slim \
    sh -c "python -m pip install --no-cache-dir -e .[test] && python -m pytest"
}

run_node_tests auth
run_node_tests user
run_node_tests role
run_node_tests audit
run_python_tests ai
