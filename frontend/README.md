# Cataí — Landing

Landing page do Cataí, app open-source que conecta estabelecimentos com recicláveis disponíveis a catadores.

URL pública: **https://catai.marliere.dev**

## Rodar localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:4321`.

## Build

```bash
npm run build      # gera dist/ (~30 KB)
npm run preview    # serve dist/ em localhost:4321 pra smoke test
```

## Deploy

```bash
npm run deploy
```

Faz `astro build` + `rsync dist/ → notebook:/home/fernando/projetos/catai-landing/landing/`.

Pré-requisitos:
- SSH alias `notebook` configurado e acessível.
- Stack `catai-landing` rodando no servidor (ver [`../infra/server/catai-landing/`](../infra/server/catai-landing/)).

O Caddy do servidor lê o volume direto, sem precisar reload — cada deploy é instantâneo.

## Onde editar conteúdo

- **Texto e estrutura**: cada componente em `src/components/*.astro` (Hero, WhatIs, HowItWorks, WhyOpenSource, Status, Help, Footer).
- **Paleta e tokens**: `tailwind.config.cjs` (cores `paper`, `soft`, `ink`, `sage`, `terracotta`, `sky`).
- **Fontes / globals**: `src/layouts/Base.astro`.

## Stack

- Astro 4 (estático, zero JS por padrão)
- Tailwind CSS 3
- DM Sans + Fraunces (Google Fonts)

## Licença

Open source, sem fins lucrativos.
