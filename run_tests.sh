#!/usr/bin/env bash

set -euo pipefail

# -----------------------------
# Config
# -----------------------------
DOCKER_COMPOSE_FILE="docker-compose-test.yml"

UNIT_TEST_CMD="npm run test"
SERVER_START_CMD="npm run start-feature"
PLAYWRIGHT_INIT_CMD="npm run int-test-init:ci"
INTEGRATION_TEST_CMD="npm run int-test"

SERVER_PORT="${SERVER_PORT:-3007}"
SERVER_START_TIMEOUT=60

# -----------------------------
# Cleanup
# -----------------------------
cleanup() {
  echo ""
  echo "🧹 Cleaning up..."

 local PORT_PID=$(lsof -t -i:$SERVER_PORT)
  if [[ -n "$PORT_PID" ]]; then
    echo "Found process $PORT_PID listening on port 3007. Terminating..."
    kill -15 "$PORT_PID" 2>/dev/null || kill -9 "$PORT_PID" 2>/dev/null
  fi

  # Stop WireMock
  echo "Stopping WireMock..."
  docker compose -f "$DOCKER_COMPOSE_FILE" down -v --remove-orphans || true

  echo "Checking for processes running on server port..."
  lsof -i:$SERVER_PORT && echo "🚨WARN: Process found on port $SERVER_PORT🚨"


  echo "✅ Cleanup complete"
}

trap cleanup EXIT INT TERM

# NPM build
npm run build

# -----------------------------
# 1️⃣ Run unit tests
# -----------------------------
echo "🧪 Running unit tests..."
$UNIT_TEST_CMD
echo "✅ Unit tests passed"

# -----------------------------
# 2️⃣ Start WireMock
# -----------------------------
echo "🚀 Starting WireMock..."
docker compose -f "$DOCKER_COMPOSE_FILE" up -d --build --remove-orphans wiremock

# -----------------------------
# 3️⃣ Start server locally
# -----------------------------
echo "🚀 Starting server on port ${SERVER_PORT}..."
$SERVER_START_CMD &
SERVER_PID=$!

# -----------------------------
# 4️⃣ Wait for server port
# -----------------------------
echo "⏳ Waiting for server port ${SERVER_PORT}..."

SECONDS_WAITED=0
until nc -z localhost "$SERVER_PORT"; do
  sleep 2
  SECONDS_WAITED=$((SECONDS_WAITED + 2))

  if [ "$SECONDS_WAITED" -ge "$SERVER_START_TIMEOUT" ]; then
    echo "❌ Server did not open port ${SERVER_PORT} within ${SERVER_START_TIMEOUT}s"
    exit 1
  fi
done

echo "✅ Server is accepting connections"

# -----------------------------
# 5️⃣ Init Playwright
# -----------------------------
echo "🎭 Initialising Playwright..."
$PLAYWRIGHT_INIT_CMD || true

# -----------------------------
# 6️⃣ Run integration tests
# -----------------------------
echo "🧪 Running integration tests..."
$INTEGRATION_TEST_CMD

echo "🎉 All tests completed successfully"
