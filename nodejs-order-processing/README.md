# Order Processing System (Node.js)

This folder contains the Node.js implementation of the Order Processing System.

Quick start (PowerShell)
1. cd /d d:\peerlands-assignment\nodejs-order-processing
2. npm install
3. npm start

By default the app listens on port 3000. Use `PORT` environment variable to change.

Run tests
- `npm test` runs a small integration runner that starts the server and executes basic API checks.

Notes
- The app uses an in-memory store at `src/store/inMemoryStore.js`.
- Background job that moves `PENDING` → `PROCESSING` is implemented in `src/jobs/scheduler.js` and is configured with `JOB_INTERVAL_MS` (ms).

Development
- Keep routes thin and implement business rules in `src/services/orderService.js`.

