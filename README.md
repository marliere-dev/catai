# Cataí

Free and open-source app that connects establishments with recyclables to collectors who pick them up.

This repository will host the full Cataí monorepo. During the MVP stage everything lives in subfolders so the projects can be split into separate repos later.

## Structure

```
catai/
├── INSTRUCTIONS.md     # product spec (Portuguese — source of truth for scope)
├── backend/            # NestJS API (active development)
├── mobile/             # Expo / React Native app — not yet scaffolded
└── frontend/           # Astro landing page — not yet scaffolded
```

## Getting started

The backend is the only project under active development. See [`backend/README.md`](./backend/README.md) for setup instructions.

## Contributing

The product scope is defined in [`INSTRUCTIONS.md`](./INSTRUCTIONS.md). Every feature must fit the MVP scope listed there. When in doubt between a simple and a sophisticated solution, choose the simple one.

## License

Open source. License file to be added.
