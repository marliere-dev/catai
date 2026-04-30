# Cataí Backend

NestJS API for the Cataí MVP. See [`../INSTRUCTIONS.md`](../INSTRUCTIONS.md) for product scope.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (for local Postgres). On Linux, add your user to the `docker` group once:
  `sudo usermod -aG docker $USER` then log out/in. Otherwise prefix `docker compose`
  commands with `sudo`.

## Setup

```bash
# 1. Copy env files
cp .env.example .env
cp .env.test.example .env.test

# 2. Start Postgres (creates both `catai` and `catai_test` databases)
docker compose up -d postgres

# 3. Install dependencies
npm install

# 4. Run migrations against the dev database
npm run migration:run

# 5. Start the API in watch mode
npm run start:dev
```

The API listens on `http://localhost:3000` by default. Verify with:

```bash
curl http://localhost:3000/health
```

## Tests

```bash
npm test            # unit tests
npm run test:e2e    # end-to-end tests (require Postgres running)
npm run test:cov    # unit tests with coverage
```

End-to-end tests use the `catai_test` database and the `FakeFirebaseTokenValidator`,
so no real Firebase credentials are needed.

## Lint & format

```bash
npm run lint
npm run format
```

## Architecture

The backend follows the modules listed in `INSTRUCTIONS.md` §274:

- `auth/` — Firebase token validation (interface + real + fake)
- `users/` — internal user records linked to Firebase UID
- `requests/` — collection requests (the heart of the MVP)
- `location/` — distance calculation and lat/lng validation
- `storage/` — Cloudflare R2 (S3-compatible) wrapper for image upload
- `health/` — liveness probe
- `database/` — TypeORM data source and migrations

All business rules live in services and are covered by unit tests. Controllers
stay thin. State transitions for requests are enforced in
`requests/requests.service.ts` and tested in `requests/requests.service.spec.ts`.

## Image upload

A collection request requires exactly one image (per `INSTRUCTIONS.md` §775-779
acceptance criterion #4). Endpoints:

| Method | Route | Body | Notes |
|---|---|---|---|
| `POST` | `/requests` | `multipart/form-data` with all request fields **plus** `image` | Image required at creation. Multipart form, not JSON. |
| `POST` | `/requests/:id/image` | `multipart/form-data` with `image` | Only for an OPEN request that currently has no image. Returns 409 if already attached. |
| `DELETE` | `/requests/:id/image` | — | Only owner, only while OPEN. Returns 204. |

Replacement = `DELETE` then `POST`. There is no `PUT` route.

### Server-side validation (`StorageService.assertImageBuffer`)

1. Multer rejects > 500 KB at the request layer.
2. Service re-checks `size <= 500*1024` (defense in depth).
3. MIME allow-list: `image/webp`, `image/jpeg`. Anything else → 415.
4. Magic-bytes check: WebP must start with `RIFF...WEBP`, JPEG with `FF D8 FF`.
   Mismatch with declared MIME → 400 (anti-spoof).

The mobile/web client is expected to compress and resize the image to WebP/JPEG
≤ 500 KB before upload (per `INSTRUCTIONS.md` §253-271).

### Storage modes

`StorageService` looks at the `R2_BUCKET` env var and picks a mode:

- **R2 mode** (production): when `R2_BUCKET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, and `R2_PUBLIC_BASE_URL` are all set. Uploads go to
  Cloudflare R2 via the AWS S3 SDK (R2 is S3-compatible).
- **In-memory mode** (default for dev/tests): when `R2_BUCKET` is empty.
  Objects live in a `Map<key, Buffer>` and URLs look like
  `http://localhost/fake-r2/<key>`. Survives only the process lifetime — perfect
  for `npm run test:e2e` or zero-cloud local development.

When a request reaches a terminal state (`cancel`/`complete`), the service tries
to delete the R2 object best-effort. Transient R2 failures are logged with the
key but never block the user. Orphan cleanup will be handled by a future cron.

### Going live with R2

1. Cloudflare Dashboard → R2 → Create bucket `catai-images-dev`.
2. Generate an R2 API token scoped to the bucket (Object Read & Write).
3. Optional: enable public access on the bucket so `R2_PUBLIC_BASE_URL` can be
   `https://pub-<hash>.r2.dev`. Otherwise bind a custom domain.
4. Populate `.env`:

   ```env
   R2_ACCOUNT_ID=<account-id>
   R2_BUCKET=catai-images-dev
   R2_ACCESS_KEY_ID=<key>
   R2_SECRET_ACCESS_KEY=<secret>
   R2_PUBLIC_BASE_URL=https://pub-<hash>.r2.dev
   ```
5. Restart `npm run start:dev`. The log line changes from
   `mode=memory` to `mode=r2 bucket=catai-images-dev`.

`.env.test` always keeps R2 vars empty so the test suite stays deterministic.
