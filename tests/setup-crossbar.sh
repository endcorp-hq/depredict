#!/bin/bash

set -euo pipefail

echo "🚀 Starting Switchboard Crossbar server (devnet) only..."

# Configurable vars with sane defaults
CROSSBAR_IMAGE="switchboardlabs/crossbar"
CONTAINER_NAME="sb-crossbar"
PORT_HTTP="${CROSSBAR_HTTP_PORT:-8080}"
PORT_DEBUG="${CROSSBAR_DEBUG_PORT:-9229}"
WALLET_KEYPAIR_PATH_DEFAULT="$HOME/.config/solana/id.json"
WALLET_KEYPAIR_PATH="${WALLET_KEYPAIR_PATH:-$WALLET_KEYPAIR_PATH_DEFAULT}"
ANCHOR_PROVIDER_URL_DEFAULT="https://api.devnet.solana.com"
ANCHOR_PROVIDER_URL="${ANCHOR_PROVIDER_URL:-$ANCHOR_PROVIDER_URL_DEFAULT}"

# Determine platform flag for Apple Silicon (arm64)
ARCH=$(uname -m || echo "")
if [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]]; then
  DOCKER_PLATFORM="${CROSSBAR_PLATFORM:-linux/amd64}"
else
  DOCKER_PLATFORM="${CROSSBAR_PLATFORM:-}"
fi

# Pre-flight checks
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed or not on PATH. Please install Docker Desktop."
  exit 1
fi

if [ ! -f "$WALLET_KEYPAIR_PATH" ]; then
  echo "❌ Wallet keypair not found at: $WALLET_KEYPAIR_PATH"
  echo "   Set WALLET_KEYPAIR_PATH or place your key at $WALLET_KEYPAIR_PATH_DEFAULT"
  exit 1
fi

# If an old container exists, remove it (in case of port conflicts)
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  if [ "$(docker inspect -f '{{.State.Running}}' ${CONTAINER_NAME})" = "true" ]; then
    echo "ℹ️ Crossbar container already running (${CONTAINER_NAME}). Skipping start."
    echo "   URL: http://localhost:${PORT_HTTP}"
    exit 0
  else
    echo "ℹ️ Removing existing stopped container ${CONTAINER_NAME}..."
    docker rm -f "${CONTAINER_NAME}" >/dev/null
  fi
fi

echo "🐳 Pulling image ${CROSSBAR_IMAGE}..."
docker pull "${CROSSBAR_IMAGE}" >/dev/null || true

# Check and adjust port if already in use
is_port_in_use() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -Pi ":$1" -sTCP:LISTEN -t >/dev/null 2>&1
  elif command -v netstat >/dev/null 2>&1; then
    netstat -an 2>/dev/null | grep -E "LISTEN|Bound" | grep -q ":$1[[:space:]]"
  else
    return 1
  fi
}

ORIGINAL_PORT_HTTP="$PORT_HTTP"
if is_port_in_use "$PORT_HTTP"; then
  echo "⚠️  Port $PORT_HTTP is in use. Searching for a free port..."
  for try in {1..10}; do
    CANDIDATE=$((ORIGINAL_PORT_HTTP + try))
    if ! is_port_in_use "$CANDIDATE"; then
      PORT_HTTP="$CANDIDATE"
      echo "ℹ️  Using alternative HTTP port: $PORT_HTTP"
      break
    fi
  done
fi

echo "▶️  Launching Crossbar on port ${PORT_HTTP}..."

DOCKER_PLATFORM_ARGS=()
if [ -n "$DOCKER_PLATFORM" ]; then
  DOCKER_PLATFORM_ARGS=(--platform "$DOCKER_PLATFORM")
fi

docker run -d \
  "${DOCKER_PLATFORM_ARGS[@]}" \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p "${PORT_HTTP}:8080" \
  -p "${PORT_DEBUG}:9229" \
  -e ANCHOR_WALLET=/app/keypair.json \
  -e ANCHOR_PROVIDER_URL="${ANCHOR_PROVIDER_URL}" \
  -e IPFS_URL=https://api.ipfs.io \
  -e DEBUG=1 \
  -v "${WALLET_KEYPAIR_PATH}:/app/keypair.json:ro" \
  "${CROSSBAR_IMAGE}" >/dev/null

# Wait for HTTP port
echo "⏳ Waiting for Crossbar to be reachable on http://localhost:${PORT_HTTP} ..."
for i in {1..30}; do
  if curl -s -o /dev/null "http://localhost:${PORT_HTTP}"; then
    echo "✅ Crossbar is up on http://localhost:${PORT_HTTP}"
    echo "   Container: ${CONTAINER_NAME}"
    echo "   Wallet: ${WALLET_KEYPAIR_PATH}"
    echo "   RPC: ${ANCHOR_PROVIDER_URL}"
    echo "   Stop with: ./tests/stop-crossbar.sh"
    exit 0
  fi
  sleep 1
done

echo "❌ Crossbar did not become reachable on port ${PORT_HTTP} in time. Check 'docker logs ${CONTAINER_NAME}'."
exit 1


