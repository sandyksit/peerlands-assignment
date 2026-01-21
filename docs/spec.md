# Order Processing System - Specification

This document defines the API, data models, behavior, and runtime details for the Order Processing System implemented in Node.js (no TypeScript).

## Goals mapped from requirement.md
- Create an order with multiple items
- Retrieve order details by order ID
- Update order status (PENDING → PROCESSING → SHIPPED → DELIVERED)
- Background job: automatically update PENDING orders to PROCESSING every interval
- List all orders, optional filter by status
- Cancel an order only if it's in PENDING

## Assumptions
- Persistence: for this assignment an in-memory store is used for simplicity. The code is layered so a DB can be swapped in later.
- Statuses: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED (CANCELLED added to represent customer cancellations).
- Background job interval is configurable via environment variable `JOB_INTERVAL_MS` (default 300000 ms = 5 minutes). For tests you can reduce it.

## Data model (JSON)

Order
- id: string (UUID)
- items: array of { productId: string, quantity: integer, price: number }
- total: number (computed)
- status: string (PENDING | PROCESSING | SHIPPED | DELIVERED | CANCELLED)
- createdAt: ISO timestamp
- updatedAt: ISO timestamp

## HTTP API
Base: `http://localhost:3000`

1) Create order
- POST /orders
- Body: { items: [ { productId, quantity, price }, ... ] }
- Returns: 201 Created, body: created Order

2) Get order by id
- GET /orders/:id
- Returns: 200 OK with order or 404 if not found

3) List orders
- GET /orders?status=PROCESSING
- Returns: 200 OK with array of orders (all or filtered by status)

4) Update order status (admin/operator)
- PATCH /orders/:id/status
- Body: { status: "PROCESSING" }
- Validates allowed statuses. Returns 200 with updated order or 400/404

5) Cancel order
- PATCH /orders/:id/cancel
- Allowed only if current status is PENDING. Sets status to CANCELLED and returns updated order. 400 if not allowed.

## Error handling
- 400 Bad Request: validation errors
- 404 Not Found: missing order
- 500 Internal Server Error: unexpected

## Runtime configuration
- PORT (default 3000)
- JOB_INTERVAL_MS (default 300000)

## Notes for implementer
- In-memory store allows quick prototyping. Swap with a proper DB (Postgres/Mongo) by replacing the store module.
- Background job uses non-blocking setInterval and updates orders atomically in the store layer.
