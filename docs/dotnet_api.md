# .NET Implementation — API Reference

Base URL: depends on Kestrel bindings (default output shown when running). Endpoints and shapes match `docs/spec.md`.

Data shapes
- Item: { productId: string, quantity: int, price: double }
- Order: { id: string, items: Item[], total: double, status: string, createdAt: DateTime, updatedAt: DateTime }

Endpoints
- POST /orders
  - Body: OrderCreateDto { items: Item[] }
  - Response: 201 Created + Order

- GET /orders
  - Query: ?status=PROCESSING
  - Response: 200 OK + Order[]

- GET /orders/{id}
  - Response: 200 OK + Order or 404

- PATCH /orders/{id}/status
  - Body: { status: string }
  - Response: 200 OK + Order or 400/404

- PATCH /orders/{id}/cancel
  - Response: 200 OK + Order or 400/404

Errors
- 400: validation or business rule failure
- 404: resource not found
