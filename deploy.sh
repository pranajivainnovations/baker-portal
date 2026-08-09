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

# Verify the target BEFORE uploading, and never create it. A directory that isn't there means the
# configuration is wrong, not that a directory needs making: `mkdir -p` on a wrong path silently
# produces an empty one, compose then finds no .env, every ${VAR} resolves to "", and the container
# starts misconfigured instead of failing. Find the real path with:
#   ssh -i KEY HOST "docker inspect crossfriend-baker-portal --format '{{index .Config.Labels \"com.docker.compose.project.working_dir\"}}'"
echo "==> [3/5] Verifying ${REMOTE_DIR} on the server..."
ssh -i "$PEM_PATH" "$REMOTE_HOST" "test -f ${REMOTE_DIR}/docker-compose.yml && test -f ${REMOTE_DIR}/.env" || {
  echo "ERROR: ${REMOTE_DIR} on ${REMOTE_HOST} is missing docker-compose.yml or .env."
  echo "Fix REMOTE_DIR in deploy.sh, or create the file that is missing on the server."
  exit 1
}

echo "==> [4/5] Uploading image to ${REMOTE_HOST}:${REMOTE_DIR}..."
# Only the image ships. The server's docker-compose.yml and .env are the source of truth for how
# this deployment is wired and are deliberately NOT overwritten from a developer machine — the local
# copy can legitimately differ, and clobbering the server's version breaks a running service in a
# way that stays invisible until the next restart. When compose genuinely needs a new variable, edit
# the server copy by hand and add the variable to its .env in the same sitting.
scp -i "$PEM_PATH" "$TARBALL" "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "==> [5/5] Restarting on the server (down -> load -> up)..."
ssh -i "$PEM_PATH" "$REMOTE_HOST" \
  "cd ${REMOTE_DIR} && docker compose down && docker load -i ${TARBALL} && docker compose up -d"

echo "==> Done. Container status:"
ssh -i "$PEM_PATH" "$REMOTE_HOST" "cd ${REMOTE_DIR} && docker compose ps"

echo
echo "Deployed ${IMAGE_NAME}:latest to ${REMOTE_HOST}."
echo
echo "Note: ${REMOTE_DIR}/docker-compose.yml and .env are NOT shipped by this script."
echo "If this deploy needs a new environment variable, add it there on the server by hand."
