# Order Processing System (Node.js)

This repository contains a simple Order Processing System implemented in Node.js (no TypeScript) to satisfy the given requirements.

Quick start
- Install dependencies: run `npm install` in the project root.
- Start the app: `npm start` (listens on PORT 3000 by default)
- Run tests: `npm test` (runs unit + integration smoke test)

Design & Notes
- See `docs/spec.md` and `docs/architecture.md` for API and architecture details.
- Uses an in-memory store by default. Replace `src/store/inMemoryStore.js` to plug in a database.
- Background job interval controlled with `JOB_INTERVAL_MS` (ms). Default 300000 (5m). For tests, set to 1000.

Requirements mapping
- Create order: POST /orders (done)
- Retrieve order: GET /orders/:id (done)
- Update status: PATCH /orders/:id/status (done)
- Background job: implemented in `src/jobs/scheduler.js` (configurable interval)
- List orders: GET /orders?status= (done)
- Cancel order: PATCH /orders/:id/cancel (only allowed in PENDING)

Other implementations
- A .NET 6 minimal API implementation is available in `dotnet-order-processing`.

Notes about AI usage (for the candidate)
- Document what AI tools you used and how you validated & corrected outputs.
