# Deploy da landing do Cataí no Oracle

A landing e o collector usam o runner `prod-aci`. O site estático é publicado
em releases por SHA; o collector é construído nativamente para ARM64.

```text
GitHub Actions → oracle-deployctl → collector ARM64 + release estática
                                      ↓
Cloudflare Tunnel → NPM → catai-caddy → landing/collector
```

## Segurança e recursos

- O runner não acessa o socket Docker diretamente.
- Somente `oracle-deployctl deploy catai <SHA> <WORKSPACE>` é permitido.
- Compose, Caddyfile, `.env` e dados ficam em `/srv/apps/catai` sob controle
  administrativo.
- O build usa no máximo 1 CPU e 3 GB e não concorre com outro deploy.
- Falha de health check restaura as tags anteriores.

## Preparação única do GitHub

1. Transferir `catai` para `marliere-dev`.
2. Adicionar somente o repositório ao runner group `oracle-production`.
3. Como ele é público, habilitar acesso público no grupo, mas restringir ao
   workflow `.github/workflows/deploy.yml@refs/heads/main`.
4. Criar Environment `production`, limitado a `main`, com aprovação.
5. Proteger `main`; pull requests nunca devem executar o job no Oracle.

## Configuração única no Oracle

```bash
sudo install -o root -g root -m 0644 \
  infra/server/catai-landing/docker-compose.prod.yml \
  /srv/apps/catai/compose.yml
sudo install -o root -g root -m 0644 \
  infra/server/catai-landing/Caddyfile /srv/apps/catai/Caddyfile
sudo install -o root -g root -m 0600 \
  infra/server/catai-landing/.env.example /srv/apps/catai/.env
sudoedit /srv/apps/catai/.env
```

Preencher `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`. Ajustar opcionalmente
`RATE_LIMIT_PER_IP_PER_HOUR`. As tags ficam em `.release.env`, gerenciado pelo
dispatcher.

No Nginx Proxy Manager, criar:

```text
catai.marliere.dev → http://catai-caddy:80
```

Não publicar portas e não iniciar outro `cloudflared`.

## Deploy normal

Push em `main` executa testes do collector e valida os HTMLs. Após aprovação de
`production`, o runner chama:

```bash
sudo /usr/local/sbin/oracle-deployctl \
  deploy catai "$GITHUB_SHA" "$GITHUB_WORKSPACE"
```

O dispatcher constrói `catai-landing-collector:<SHA>`, copia `frontend/site`
para `/srv/apps/catai/releases/<SHA>`, atualiza tags e valida `/api/health` e a
landing. Mantém cinco releases estáticas e três imagens do collector.

## Operação e diagnóstico

```bash
sudo docker compose \
  --project-directory /srv/apps/catai \
  --env-file /srv/apps/catai/.env \
  --env-file /srv/apps/catai/.release.env \
  -f /srv/apps/catai/compose.yml ps

journalctl -t oracle-deployctl -n 100 --no-pager
docker logs catai-collector --tail 100
docker logs catai-caddy --tail 100
find /srv/apps/catai/releases -mindepth 1 -maxdepth 1 -type d
```
