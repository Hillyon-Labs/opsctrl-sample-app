# OpsCtrl Sample App

A minimal NestJS application designed to be deployed on [OpsCtrl](https://opsctrl.dev) with one click. It demonstrates the full platform stack: PostgreSQL provisioning, Redis-backed job queues, and Kubernetes orchestration — all wired up automatically on deploy.

## What this app demonstrates

| Feature | How it's used |
|---------|--------------|
| **NestJS** | Framework — modules, controllers, services, DTOs |
| **PostgreSQL** | Stores `Note` entities via TypeORM — provisioned automatically by OpsCtrl |
| **Redis + BullMQ** | Every note creation enqueues a `note-processing` job — provisioned automatically by OpsCtrl |
| **Background Worker** | `NoteProcessor` picks up jobs, sets status `pending → processing → processed` |
| **Health Check** | `GET /health` checks both PostgreSQL and Redis via `@nestjs/terminus` |

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/notes` | Create a note — triggers a BullMQ job |
| `GET` | `/notes` | List all notes (shows status progression) |
| `GET` | `/notes/:id` | Get a single note |
| `PATCH` | `/notes/:id` | Update title or content |
| `DELETE` | `/notes/:id` | Soft delete a note |
| `GET` | `/health` | Health check — DB + Redis |

Interactive docs at `/api/docs` when running locally.

## Stack

```
NestJS 11         — framework
TypeORM 0.3       — ORM
PostgreSQL 16     — primary database      (OpsCtrl provisions)
Redis 7           — queue backend         (OpsCtrl provisions)
BullMQ 5          — job queue
@nestjs/terminus  — health checks
Kubernetes / K3s  — orchestration         (OpsCtrl manages)
Docker + Kaniko   — container builds      (OpsCtrl manages)
```

## Local development

```bash
# Install dependencies
npm install

# Start PostgreSQL + Redis (no .env file needed — defaults match docker-compose)
npm run docker:dev:up

# Start dev server
npm run start:dev
```

App available at `http://localhost:3000`
API docs at `http://localhost:3000/api/docs`

## No environment variables required

All env vars have sensible defaults. The app runs out of the box with `docker-compose up` and `npm run start:dev` — no `.env` file needed for local development.

When deployed on OpsCtrl, the platform injects `DATABASE_URL` and `REDIS_URL` automatically.

## nestdeploy.yaml

This repo includes a `nestdeploy.yaml` that tells OpsCtrl exactly how to deploy it:

```yaml
node: '20'
database:
  type: postgresql
  migrateCommand: 'npm run migration:run'
services:
  redis: true
healthCheck:
  path: '/health'
```

No configuration needed — OpsCtrl reads this file automatically during the build.
