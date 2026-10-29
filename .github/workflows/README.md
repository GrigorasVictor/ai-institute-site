# Workflow Notes (PROD ADMIN)

This folder holds GitHub Actions workflows.

Compose files: `compose.yaml` (local, production-like), `compose.dev.yaml` (development), `compose.prod.yaml` (production server).

## Image builds (`deploy.yml`)

- Runs on pushes to `master` and on manual dispatch.
- Changes that cannot affect an image — Markdown, `docs/`, the compose files, `scripts/`, and tooling folders — are ignored via `paths-ignore`.
- A `changes` job detects which service changed, so only the affected images are rebuilt: `server`, `web`, `paper-sync`, `snipe-it`. A manual dispatch rebuilds all of them.
- CI does not pull base images from public registries. Everything comes from GHCR:
  - `node:22-alpine`, `python:3.12-slim`, `moby/buildkit`, and `snipe/snipe-it` are mirrored into GHCR by `_mirror-images.yml`.
  - The Dockerfiles default to `public.ecr.aws/...` for local builds; `_build-image.yml` passes `NODE_IMAGE` / `PYTHON_IMAGE` build args that point at the GHCR mirrors.
  - `deploy.yml` calls the mirror workflow first, so a missing tag is copied before the builds start. Once a tag exists, only GHCR is contacted.

### Bumping mirrored versions

1. Update `NODE_VERSION` / `PYTHON_VERSION` / `SNIPE_IT_VERSION` / `BUILDKIT_VERSION` in `_mirror-images.yml`.
2. Update the matching `ARG` default in the Dockerfile and `BUILDKIT_VERSION` in `_build-image.yml`.
3. Merge. The next build copies the new tag, then uses it.

Why mirror at all: Docker Hub rate-limits anonymous pulls, and ECR Public caps anonymous use at **500 GB/month** (plus 1 pull/second). GitHub-hosted runners share IPs, so neither is reliable for CI. A pinned GHCR copy removes both.

The mirror packages are private by default and CI authenticates with `GITHUB_TOKEN`. A local build of `snipe-it/` needs `docker login ghcr.io`, or pass `--build-arg SNIPE_IT_IMAGE=snipe/snipe-it:v8.8.3`. The service Dockerfiles work locally without a login because they default to ECR Public.

## Database backup (prod compose)

The production compose file includes a simple backup service that:
- runs `pg_dump` once per day
- writes to `./backups` on the server
- deletes backups older than 7 days

### Restore DB (example)

1. Pick a backup file name from the server:
	- backups/backup_YYYY-MM-DD_HH-MM-SS.dump
2. Restore into the database:

```
docker compose -f compose.prod.yaml exec -T postgres pg_restore -d $POSTGRES_DB < backups/backup_YYYY-MM-DD_HH-MM-SS.dump
```

Notes:
- Run this on the server where the backups live.
- This is a full database restore from a custom-format dump.

## Restore Images from github (example)

1. Look in the repo for an image that is old enough:
2. Copy the SHA
3. Then change in the docker compose

```
image: ghcr.io/airi-utcn/ai-institute-site/web:abc123def
image: ghcr.io/airi-utcn/ai-institute-site/server:abc123def
```

4. Then `docker compose -f compose.prod.yaml up -d`