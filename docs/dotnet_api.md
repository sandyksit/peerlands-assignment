# .NET Implementation — API Reference

Base URL: depends on Kestrel bindings (default output shown when running). All endpoints match `docs/spec.md`.

## Data Shapes

### Item
```csharp
{
  productId: string,
  quantity: int,
  price: double
}
```

### Order (Updated with Payment Support)
```csharp
{
  id: string,
  items: Item[],
  total: double,
  totalPaid: double,
  status: string,  // PENDING | PROCESSING | SHIPPED | DELIVERED | CANCELLED
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Payment
```csharp
{
  id: string,
  orderId: string,
  amount: double,
  paymentDate: DateTime,
  paymentMethod: string (optional)
}
```

## Endpoints

### Order Management

#### Create Order
- **POST /orders**
- Body: `OrderCreateDto { items: Item[] }`
- Response: 201 Created with Order (status=PENDING, totalPaid=0)

#### Get Order
- **GET /orders/{id}**
- Response: 200 OK with Order or 404 Not Found

#### List Orders
- **GET /orders?status=PROCESSING**
- Query: status (optional)
- Response: 200 OK with Order array

#### Update Order Status (Admin)
- **PATCH /orders/{id}/status**
- Body: `{ status: "PROCESSING" }`
- Response: 200 OK with updated Order or 400/404

#### Cancel Order
- **PATCH /orders/{id}/cancel**
- Allowed if status=PENDING AND totalPaid=0
- Response: 200 OK with updated Order or 400/404

### Payment Management

#### Create Payment
- **POST /orders/{id}/payments**
- Body: `PaymentCreateDto { amount: double, paymentMethod: string }`
- Validations:
  - amount > 0
  - amount <= (order.total - order.totalPaid)
  - order exists
  - order status = PENDING
- Response: 201 Created with `{ payment, order }` or 400/404

#### Get Payments for Order
- **GET /orders/{id}/payments**
- Response: 200 OK with Payment array or 404

## Error Handling

- **400 Bad Request**: Validation failure, overpayment, wrong order status
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Unexpected error

## Example Workflow

```powershell
# Create order
$body = @{ items = @(@{ productId = "p1"; quantity = 2; price = 50 }) } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/orders" -Method POST -Body $body -ContentType "application/json"

# Make payment
$body = @{ amount = 60; paymentMethod = "credit_card" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/orders/{id}/payments" -Method POST -Body $body -ContentType "application/json"

# Get payments
Invoke-WebRequest -Uri "http://localhost:5000/orders/{id}/payments" -Method GET
```
