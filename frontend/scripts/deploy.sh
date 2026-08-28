#!/usr/bin/env bash
# Rsync da landing pro servidor `notebook`. Sem build — single-file React via CDN.
# Pré-requisito: SSH alias `notebook` configurado, stack catai-landing rodando lá.

set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE_HOST="notebook"
REMOTE_PATH="/home/fernando/projetos/catai-landing/landing/"
PUBLIC_URL="https://catai.marliere.dev"

echo "→ rsync site/ → ${REMOTE_HOST}:${REMOTE_PATH}"
rsync -avz --delete site/ "${REMOTE_HOST}:${REMOTE_PATH}"

echo "✓ done. ${PUBLIC_URL}"
