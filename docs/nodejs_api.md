# Node.js Implementation — API Reference

Base URL: http://localhost:3000

Data shapes
- Item: { productId: string, quantity: integer, price: number }
- Order: {
  id: string,
  items: Item[],
  total: number,
  status: string, // PENDING | PROCESSING | SHIPPED | DELIVERED | CANCELLED
  createdAt: string (ISO),
  updatedAt: string (ISO)
}

Endpoints
- POST /orders
  - Body: { items: Item[] }
  - Response: 201 Created + Order

- GET /orders
  - Query: ?status=PROCESSING (optional)
  - Response: 200 OK + Order[]

- GET /orders/:id
  - Response: 200 OK + Order or 404

- PATCH /orders/:id/status
  - Body: { status: "PROCESSING" }
  - Response: 200 OK + Order, 400 on invalid status, 404 if missing

- PATCH /orders/:id/cancel
  - No body
  - Response: 200 OK + Order, 400 if order not in PENDING, 404 if missing

Errors
- 400: validation errors (returns { error: string })
- 404: not found (returns { error: string })

Environment
- PORT (default 3000)
- JOB_INTERVAL_MS (ms, default 300000)

Examples
- Create order
  POST /orders
  Body: { "items": [{ "productId": "p1", "quantity": 2, "price": 10 }] }
