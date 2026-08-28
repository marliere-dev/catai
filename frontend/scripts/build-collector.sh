#!/usr/bin/env bash
# Builda a imagem do collector direto no daemon Docker do notebook via SSH,
# sem save/scp/load — o build materializa a imagem direto no servidor.
#
# Uso:   ./scripts/build-collector.sh [TAG]
# Ex.:   ./scripts/build-collector.sh v0.1.0
#
# Pré-requisitos:
#   - SSH funcional como alias "notebook" (~/.ssh/config)
#   - Cliente Docker local (não precisa ser daemon)
#   - /home/fernando/projetos/catai-landing/{Caddyfile,docker-compose.prod.yml,.env}
#     já presentes no notebook

set -euo pipefail

TAG="${1:-v0.1.0}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE_HOST="notebook"
REMOTE_DIR="/home/fernando/projetos/catai-landing"

echo "==> Usando daemon remoto (ssh://${REMOTE_HOST})"
export DOCKER_HOST="ssh://${REMOTE_HOST}"

echo "==> Build collector (catai-landing-collector:${TAG})"
docker build -t "catai-landing-collector:${TAG}" "${REPO_ROOT}/collector"

unset DOCKER_HOST

echo "==> Compose up no servidor (recria só o collector)"
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml up -d collector"

echo "==> Done. catai-landing-collector:${TAG} ativo."
