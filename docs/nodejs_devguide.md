# Node.js Developer Guide

Project layout
- `src/server.js` - Express app wiring and job start
- `src/routes/orders.js` - HTTP routes
- `src/services/orderService.js` - business logic
- `src/store/inMemoryStore.js` - simple repository
- `src/jobs/scheduler.js` - background job

How to run locally
1. npm install
2. JOB_INTERVAL_MS=1000 npm start (for quick job runs)

How to swap the store for a DB
1. Implement the same methods as `inMemoryStore` (save, getById, list, update, clear)
2. Replace the require/import in `orderService.js` to your DB adapter

Testing
- `npm test` runs a small integration script that starts the server and runs basic requests.

Coding conventions
- Use CommonJS modules (require/exports)
- Keep controllers thin. Put validation and business rules in `services`.
