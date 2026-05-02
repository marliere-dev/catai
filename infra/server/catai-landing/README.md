# catai-landing — Docker stack

Stack que serve a landing do Cataí em `https://catai.marliere.dev` e processa o form `/feedback`.

Composição:

- **`catai-collector`** (Go service, porta 8081 interna) — recebe `POST /api/contact`, valida, grava em `./data/contacts.jsonl`, notifica um chat do Telegram. Source em `frontend/collector/`.
- **`catai-caddy`** (caddy:2-alpine) — serve estáticos de `./landing/`, faz reverse proxy de `/api/contact` pro collector.
- **`catai-cloudflared`** — tunnel reverso pra Cloudflare → `catai.marliere.dev`.

Tudo na bridge `catai-net`. Sem porta exposta no host.

## Setup inicial (uma vez)

```bash
cp .env.example .env
nano .env     # cole TUNNEL_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

mkdir -p landing data

# O collector roda como UID 65532 (nonroot/distroless) e precisa escrever em ./data/.
# Como `mkdir` cria como o user logado, ajusta o ownership pra evitar 500 no primeiro POST:
docker run --rm -v "$PWD/data:/data" alpine chown -R 65532:65532 /data

# Build da imagem do collector direto no daemon do servidor
# (do host de dev, com SSH pro notebook configurado):
cd <repo>/frontend
./scripts/build-collector.sh v0.1.0

# Sobe o stack
ssh notebook 'cd /home/fernando/projetos/catai-landing && docker compose -f docker-compose.prod.yml up -d'

# Verifica
ssh notebook 'docker logs catai-cloudflared 2>&1 | grep -i "Connection registered"'
ssh notebook 'docker logs catai-collector | tail'
```

## Atualizar o site

A pasta `./landing/` é montada read-only. Pra publicar mudança no HTML:

```bash
cd <repo>/frontend
./scripts/deploy.sh
```

## Atualizar o collector

```bash
cd <repo>/frontend
./scripts/build-collector.sh v0.1.1
# bump COLLECTOR_TAG no .env do servidor pra v0.1.1
ssh notebook 'cd /home/fernando/projetos/catai-landing && docker compose -f docker-compose.prod.yml up -d collector'
```

## Operações

```bash
# Status
docker compose -f docker-compose.prod.yml ps

# Logs
docker logs -f catai-collector
docker logs -f catai-caddy
docker logs -f catai-cloudflared

# Ver os leads gravados em JSONL
ssh notebook 'tail -f /home/fernando/projetos/catai-landing/data/contacts.jsonl'

# Smoke test do collector (de fora)
curl -X POST https://catai.marliere.dev/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Teste","papel":"simpatizante","cidade":"Curitiba","contato":"@teste"}'
# → {"ref":"REQ-..."}
```

## Quando trocar token do tunnel ou do Telegram

1. Edita `.env` no servidor com o novo valor.
2. `docker compose -f docker-compose.prod.yml up -d` (recria só o que mudou).
