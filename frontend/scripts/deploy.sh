#!/usr/bin/env bash
# Build + rsync da landing pro servidor `notebook`.
# Pré-requisito: SSH alias `notebook` configurado e acessível, stack
# catai-landing rodando lá (ver infra/server/catai-landing/README.md).

set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE_HOST="notebook"
REMOTE_PATH="/home/fernando/projetos/catai-landing/landing/"
PUBLIC_URL="https://catai.marliere.dev"

echo "→ build"
npm run build

echo "→ rsync dist/ → ${REMOTE_HOST}:${REMOTE_PATH}"
rsync -avz --delete dist/ "${REMOTE_HOST}:${REMOTE_PATH}"

echo "✓ done. ${PUBLIC_URL}"
