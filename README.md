# AI IT Helpdesk

Phases 1 and 2 are implemented: administration foundation plus helpdesk tickets (create, assign, workflow, comments, attachments, and role-scoped dashboards). Sign-in uses database sessions. Knowledge, assets, SLA, and the AI assistant are not built yet.

## Run locally

PostgreSQL is started for you by the development script. It listens on `127.0.0.1:5433` and is not published to the network.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Copy `.env.example` to `.env` before the first run and set `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD`. The seed refuses short or well-known placeholder passwords.

## Checks

```bash
npm run lint
npm run typecheck
npx prisma validate
npm test
```

Tests use a separate database named `helpdesk_test`. They do not truncate the development database.

## Documents

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md)
- [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)
- [SECURITY.md](SECURITY.md)
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
- [USER_GUIDE.md](USER_GUIDE.md)
- [TESTING_GUIDE.md](TESTING_GUIDE.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [CHANGELOG.md](CHANGELOG.md)
- [PHASE1_COMPLETION_REPORT.md](PHASE1_COMPLETION_REPORT.md)
