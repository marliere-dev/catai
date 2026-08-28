# Cataí — Landing

Landing page do Cataí em **`https://catai.marliere.dev`**.

## Estrutura

Single-file React via CDN (zero build), idêntico ao preview do Claude Design.

```
frontend/
├── site/                ← o que vai pro servidor
│   ├── index.html       ← entrypoint, importa React/ReactDOM/Babel via unpkg
│   └── sections.jsx     ← Hero, WhatIs, HowItWorks, WhyOpenSource, Status, Help, Footer
└── scripts/deploy.sh    ← deploy manual legado do antigo notebook
```

Todo o conteúdo (texto, paleta, espaçamentos) vive em `site/sections.jsx`. A paleta padrão é `salvia` (verde sálvia + bege + ink escuro). O export inclui também `terracota` e `ceu` se um dia quiser switchar.

## Rodar localmente

```bash
cd site
python3 -m http.server 4321
# abre em http://localhost:4321
```

## Deploy

Push em `main` executa `.github/workflows/deploy.yml`. Após os testes, o
Environment `production` exige aprovação e o runner do Oracle publica a nova
release. Ver [`../infra/server/catai-landing/`](../infra/server/catai-landing/)
para configuração e diagnóstico.

## Editar conteúdo

Tudo em `site/sections.jsx`. Procura o componente (`function Hero`, `function WhatIs`, etc.) e edita o JSX/strings. Sem build — recarrega a página e vê o resultado.

## Stack

- React 18 + ReactDOM via unpkg
- Babel standalone (transpila JSX no browser)
- DM Sans + Fraunces (Google Fonts)
- Sem bundler, sem npm install pra dev local
