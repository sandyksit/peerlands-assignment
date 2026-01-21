# Architecture Overview

This project implements a simple, modular Node.js backend (no TypeScript) to satisfy the order processing requirements.

High-level components
- api (HTTP layer): Express-based routes that validate input and translate to service calls.
- services: Business logic (create order, cancel, list, update status).
- store: In-memory repository that persists orders during runtime; easy to replace with DB adapter.
- jobs: Background worker that transitions PENDING orders to PROCESSING at configured intervals.
- tests: Unit tests for services and API endpoints.

Design principles
- Separation of concerns: routes are thin; services implement rules; store handles persistence.
- Configurable job interval and port via environment variables.
- Idempotent operations where relevant.

Sequence: create order
1. Client POST /orders
2. Route validates request, calls OrderService.create
3. Service constructs order (computes total), calls Store.save
4. Store returns persisted order with id and timestamps
5. API returns 201 with order JSON

Background job
- The JobScheduler queries store for PENDING orders and calls service.transitionToProcessing when rules are met. It logs updates and continues.

Extending to DB
- Implement the same store interface (getById, list, save, update) backed by a DB and swap in.
