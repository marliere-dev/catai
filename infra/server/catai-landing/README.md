# catai-landing — Docker stack

Stack que serve a landing page do Cataí em `https://catai.marliere.dev`.

Composição:

- **`catai-caddy`** (caddy:2-alpine) — serve os arquivos estáticos de `./landing/` via HTTP na porta 80, dentro da rede `catai-net`. Não expõe porta no host.
- **`catai-cloudflared`** (cloudflare/cloudflared:latest) — abre um Tunnel reverso pra Cloudflare; mapeia `catai.marliere.dev` → `http://catai-caddy:80`. Token vem do `.env`.

Padrão idêntico ao `pursuit-landing` que já roda neste servidor.

## Setup inicial (uma vez)

```bash
cp .env.example .env
nano .env     # cole TUNNEL_TOKEN=eyJh...

mkdir -p landing
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f
# Aguarde "Connection registered" no log do cloudflared (Ctrl+C pra sair)
```

O **Public Hostname** do tunnel deve apontar pra `http://catai-caddy:80` no dashboard do Cloudflare Zero Trust (`Networks → Tunnels → catai → Public Hostnames`).

## Atualizar o site

A pasta `./landing/` é montada read-only no caddy. Pra atualizar, rode no host de dev:

```bash
cd <repo>/frontend
npm run deploy
```

O script faz `astro build` + `rsync dist/ → notebook:/home/fernando/projetos/catai-landing/landing/`. Caddy lê o volume direto, sem precisar reload — atualização é instantânea.

## Operações comuns

```bash
# Status
docker compose -f docker-compose.prod.yml ps

# Logs
docker compose -f docker-compose.prod.yml logs -f
docker logs -f catai-caddy
docker logs -f catai-cloudflared

# Reiniciar tudo
docker compose -f docker-compose.prod.yml restart

# Derrubar
docker compose -f docker-compose.prod.yml down
```

## Quando trocar o token do tunnel

1. Edita `.env` com o novo `TUNNEL_TOKEN`.
2. `docker compose -f docker-compose.prod.yml up -d` (recria só o cloudflared, caddy fica intacto).
