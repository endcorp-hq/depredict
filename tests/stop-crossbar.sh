#!/bin/bash

set -euo pipefail

CONTAINER_NAME="sb-crossbar"

echo "🛑 Stopping Crossbar container (${CONTAINER_NAME})..."
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker stop "${CONTAINER_NAME}" >/dev/null || true
fi

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker rm -f "${CONTAINER_NAME}" >/dev/null || true
fi

echo "✅ Crossbar stopped and removed"


