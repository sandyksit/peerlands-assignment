# Node.js Implementation — API Reference

Base URL: http://localhost:3000

## Data Shapes

### Item
```json
{ "productId": "string", "quantity": "integer", "price": "number" }
```

### Order (Updated with Payment Support)
```json
{
  "id": "string (UUID)",
  "items": [{ "productId": "string", "quantity": "integer", "price": "number" }],
  "total": "number",
  "totalPaid": "number",
  "status": "PENDING | PROCESSING | SHIPPED | DELIVERED | CANCELLED",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### Payment
```json
{
  "id": "string (UUID)",
  "orderId": "string",
  "amount": "number",
  "paymentDate": "ISO timestamp",
  "paymentMethod": "string (optional)"
}
```

## Endpoints

### Order Management

#### Create Order
- **POST /orders**
- Body: `{ "items": [{ "productId": "p1", "quantity": 2, "price": 10 }] }`
- Response: 201 Created with Order (status=PENDING, totalPaid=0)

#### Get Order
- **GET /orders/:id**
- Response: 200 OK with Order or 404 Not Found

#### List Orders
- **GET /orders**
- Query: `?status=PENDING` (optional)
- Response: 200 OK with Order array

#### Update Order Status (Admin)
- **PATCH /orders/:id/status**
- Body: `{ "status": "PROCESSING" }`
- Response: 200 OK with updated Order, 400 on validation error, 404 if missing

#### Cancel Order
- **PATCH /orders/:id/cancel**
- Allowed only if status=PENDING AND totalPaid=0
- Response: 200 OK with updated Order (status=CANCELLED), 400 if not allowed, 404 if missing

### Payment Management

#### Create Payment
- **POST /orders/:id/payments**
- Body: `{ "amount": 50, "paymentMethod": "credit_card" }`
- Validations:
  - amount > 0
  - amount <= (total - totalPaid)
  - order must exist
  - order status must be PENDING
- Response: 201 Created with `{ payment, order }`, 400 on validation error, 404 if order missing

#### Get Payments for Order
- **GET /orders/:id/payments**
- Response: 200 OK with Payment array, 404 if order missing

## Error Responses

### 400 Bad Request
```json
{ "error": "item.quantity must be integer > 0" }
```

### 404 Not Found
```json
{ "error": "Order not found" }
```

## Example Workflow

```bash
# Create order with total=100
POST /orders
Body: { "items": [{ "productId": "p1", "quantity": 2, "price": 50 }] }
Response: Order { id: "...", total: 100, totalPaid: 0, status: "PENDING" }

# Make partial payment
POST /orders/{id}/payments
Body: { "amount": 60, "paymentMethod": "credit_card" }
Response: { payment: {...}, order: {..., totalPaid: 60, status: "PENDING" } }

# Make second payment (remaining)
POST /orders/{id}/payments
Body: { "amount": 40, "paymentMethod": "bank_transfer" }
Response: { payment: {...}, order: {..., totalPaid: 100, status: "PENDING" } }

# Background job runs (every 5 min by default)
# Detects order with totalPaid=100 >= total=100
# Auto-transitions to PROCESSING

GET /orders/{id}
Response: Order { status: "PROCESSING", totalPaid: 100 }

# Get all payments for order
GET /orders/{id}/payments
Response: [
  { id: "...", orderId: "...", amount: 60, ... },
  { id: "...", orderId: "...", amount: 40, ... }
]
```

## Environment
- PORT (default 3000)
- JOB_INTERVAL_MS (default 300000, in milliseconds)
