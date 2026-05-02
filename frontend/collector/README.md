# catai-landing-collector

Pequeno serviço Go que recebe submissões do form `/feedback` da landing,
valida, persiste em JSONL e notifica um chat do Telegram.

Endpoints:

- `POST /contact` — recebe a submissão.
- `GET /health` — `200 ok`.

## Schema da submissão

```json
{
  "nome":     "string (obrig., ≤256)",
  "papel":    "catador | cooperativa | designer | dev | simpatizante | testes",
  "cidade":   "string (obrig., ≤256)",
  "contato":  "string livre (obrig., ≤256) — email, whatsapp, telegram, etc.",
  "mensagem": "string (opcional, ≤4096)",
  "website":  "honeypot — bots preenchem; humanos não veem o campo"
}
```

`papel` é normalizado pra lowercase. Qualquer valor fora da allow-list retorna 400.

## Variáveis de ambiente

| Var | Default | Função |
|---|---|---|
| `ADDR` | `:8081` | Porta de escuta. |
| `JSONL_PATH` | `/data/contacts.jsonl` | Onde gravar leads (1 JSON por linha). |
| `TELEGRAM_BOT_TOKEN` | — | Bot pra notificar. Se vazio, vira no-op. |
| `TELEGRAM_CHAT_ID` | — | Chat de destino. Se vazio, vira no-op. |
| `RATE_LIMIT_PER_IP_PER_HOUR` | `10` | Janela móvel de 1h por IP. |

## Build local + tests

```bash
go test ./...
go build -o /tmp/catai-collector .
TELEGRAM_BOT_TOKEN=… TELEGRAM_CHAT_ID=… /tmp/catai-collector
```

## Build remoto (no daemon do notebook)

```bash
DOCKER_HOST=ssh://notebook docker build -t catai-landing-collector:v0.1.0 .
```

Esse padrão evita salvar tar.gz local e fazer scp. Veja
`../scripts/build-collector.sh` pra um wrapper.
