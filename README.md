# Cataí

Free and open-source app that connects establishments with recyclables to collectors who pick them up.

This repository hosts the Cataí monorepo. During the MVP stage everything lives in subfolders so the projects can be split into separate repos later.

## Structure

```
catai/
├── INSTRUCTIONS.md                # product spec (Portuguese — source of truth)
├── backend/                       # NestJS API
├── frontend/                      # Astro landing page (https://catai.marliere.dev)
├── mobile/                        # Expo / React Native app — not yet scaffolded
└── infra/server/catai-landing/    # Docker stack templates for the home server
```

## Getting started

- Backend: [`backend/README.md`](./backend/README.md).
- Landing: [`frontend/README.md`](./frontend/README.md).
- Server stack: [`infra/server/catai-landing/README.md`](./infra/server/catai-landing/README.md).

## Contributing

The product scope is defined in [`INSTRUCTIONS.md`](./INSTRUCTIONS.md). Every feature must fit the MVP scope listed there. When in doubt between a simple and a sophisticated solution, choose the simple one.

## License

Open source. License file to be added.
