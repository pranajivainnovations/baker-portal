#!/usr/bin/env bash
# One-click deploy for crossfriend-baker-portal -> the production container.
# Same build -> save -> scp -> ssh -> load -> restart cycle as crossfriend-ops/deploy.sh.
# Run from anywhere; paths below resolve relative to this file, not the caller's cwd.
#
# Usage: ./deploy.sh          (Git Bash, or double-click deploy.bat on Windows)

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# ── Configuration — edit these to match your setup ─────────────────────────────
IMAGE_NAME="crossfriend-baker-portal"
PEM_PATH="${DEPLOY_PEM_PATH:-pranajivainnovationpem.pem}"   # override with: DEPLOY_PEM_PATH=/path/to/key.pem ./deploy.sh
REMOTE_HOST="ubuntu@13.62.195.167"
REMOTE_DIR="/home/ubuntu/crossfriend-baker-portal"
# ─────────────────────────────────────────────────────────────────────────────

TARBALL="${IMAGE_NAME}.tgz"

if [ ! -f "$PEM_PATH" ]; then
  echo "PEM key not found at: $PEM_PATH"
  echo "Set DEPLOY_PEM_PATH=/full/path/to/key.pem before running, or edit PEM_PATH in deploy.sh."
  exit 1
fi

echo "==> [1/5] Building ${IMAGE_NAME}:latest (--no-cache)..."
docker build --no-cache -t "${IMAGE_NAME}:latest" .

echo "==> [2/5] Saving image to ${TARBALL}..."
docker save -o "$TARBALL" "${IMAGE_NAME}:latest"

# First deploy needs the directory and its .env to exist before compose is run there.
echo "==> [3/5] Ensuring ${REMOTE_DIR} exists..."
ssh -i "$PEM_PATH" "$REMOTE_HOST" "mkdir -p ${REMOTE_DIR}"
scp -i "$PEM_PATH" docker-compose.yml "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "==> [4/5] Uploading image to ${REMOTE_HOST}:${REMOTE_DIR}..."
scp -i "$PEM_PATH" "$TARBALL" "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "==> [5/5] Restarting on the server (down -> load -> up)..."
# `docker compose down` is tolerated on a first deploy where nothing is running yet.
ssh -i "$PEM_PATH" "$REMOTE_HOST" \
  "cd ${REMOTE_DIR} && (docker compose down || true) && docker load -i ${TARBALL} && docker compose up -d"

echo "==> Done. Container status:"
ssh -i "$PEM_PATH" "$REMOTE_HOST" "cd ${REMOTE_DIR} && docker compose ps"

echo
echo "Deployed ${IMAGE_NAME}:latest to ${REMOTE_HOST}."
echo
echo "First deploy? ${REMOTE_DIR}/.env must contain MEDUSA_BACKEND_URL, and"
echo "baker.crossfriend.in must resolve to this host with TLS terminating in front of port 5000."
