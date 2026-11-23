# Cataí Mobile

App React Native (iOS + Android) que conecta donos de recicláveis a catadores. O design segue 1:1 o protótipo final entregue pelo Claude Design — paleta sálvia, fontes DM Sans + Fraunces, fluxos definidos em `INSTRUCTIONS.md`.

> Stack: Expo SDK 54 + React Native 0.81 + React 19 + TypeScript estrito, Expo Router (file-based), MapLibre RN para mapa, Firebase JS SDK pra auth, AsyncStorage pra persistência local do modo (Dono/Catador).

## Por dentro

```
mobile/
├── app/                   Rotas Expo Router (12 telas)
│   ├── _layout.tsx        Loader de fontes + StatusBar
│   ├── index.tsx          Splash + redirect conforme auth/modo
│   ├── splash.tsx         Boas-vindas (S1)
│   ├── (auth)/            Cadastro/Login/Verificar e-mail (S2-S4)
│   ├── escolher-perfil.tsx (S5) — grava `catai-mode` no AsyncStorage
│   ├── (dono)/            Tabs Home + Perfil (S6, S12)
│   ├── (catador)/         Tabs Pedidos + Perfil (S10, S12)
│   ├── nova.tsx           Nova solicitação com câmera (S7)
│   ├── minhas.tsx         Lista do dono (S8)
│   ├── mapa.tsx           Mapa real com MapLibre (S11)
│   └── detalhe/[id].tsx   Detalhe + ações (S9, 5 variantes via ?ctx=)
└── src/
    ├── theme/             tokens + carregador de fontes
    ├── icons/             RIcon + 23 paths SVG do bundle
    ├── components/        15 componentes portados do design
    ├── api/               client + auth + requests + me + firebase
    ├── hooks/             useAuth + useMode
    ├── lib/labels.ts      backend enums → labels do design
    └── types/api.ts       espelho dos tipos do backend
```

## Pré-requisitos

- Node 18+ e npm
- Conta Firebase com Email/Password ativado em **Authentication**
- Conta EAS (opcional, mas recomendada para dev build)
- Backend Cataí rodando e acessível pelo aparelho/simulador

## Setup

```bash
cd mobile
npm install --legacy-peer-deps
cp .env.example .env
# preencha as variáveis (veja abaixo)
```

`.env` esperado:

| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL do backend (ex.: `http://192.168.15.10:3000` para LAN, `http://localhost:3000` no simulador iOS) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | apiKey do projeto Firebase |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | authDomain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | projectId |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | storageBucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | appId |

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint zero-warnings
npm run format      # prettier --write
npm test            # jest (utilitários puros)
npm start           # expo start
npm run ios         # expo start --ios
npm run android     # expo start --android
```

## Rodando localmente

**Importante**: o app usa MapLibre RN, que tem código nativo. Não roda no Expo Go — é necessário um **dev build**.

```bash
# Primeira vez (gera dev client em nuvem)
eas login
eas build --profile development --platform ios       # ou --platform android

# Instala o build no aparelho/simulador, depois:
npm start
# Escaneia o QR / abre o link "exp+catai://..."
```

## Tests

Os testes cobrem o módulo `src/lib/labels.ts` — único utilitário puro estável o suficiente pra justificar testes unitários nesta fase. Para validar UI, monte o dev build e percorra cada uma das 12 telas.

```bash
npm test
```

## Decisões importantes

- **Design não muda.** Fidelidade visual ao protótipo é regra absoluta — ver `app-design-prompt.md`.
- **Sem mocks de dados.** Todas as telas chamam o backend real via `src/api/*`. Quando offline, mostram empty states.
- **Modo Dono/Catador é só local.** Backend não diferencia papéis (decisão aplicada na migration `1777800000000-DropUserRole.ts` do backend). O app guarda a preferência em `catai-mode` no AsyncStorage.
- **Localização hard-coded por enquanto.** Coordenadas de São Paulo são usadas em `pedidos.tsx`, `mapa.tsx` e `nova.tsx` até o módulo de geolocalização entrar.
