# Order Processing System - Specification

This document defines the API, data models, behavior, and runtime details for the Order Processing System implemented in both Node.js and .NET.

## Updated Goals (With Payment Requirements)
- Create an order with multiple items (no payment required initially)
- Customers can place orders without making payments - orders remain in PENDING state
- Customers can make multiple partial payments for an order
- Retrieve order details by order ID
- Update order status (PENDING to PROCESSING to SHIPPED to DELIVERED)
- Background job: automatically update orders to PROCESSING ONLY when total payment equals total order price
- List all orders, optional filter by status
- Cancel an order only if it's in PENDING state AND total_paid = 0

## Key Features

### Order & Payment Flow
1. Customer creates an order with items (order is PENDING, totalPaid = 0)
2. Customer can make partial payments towards the order
3. Multiple payments allowed per order
4. Order transitions to PROCESSING ONLY when `total_paid >= total_order_price`
5. Once PROCESSING, order cannot be cancelled
6. Order can be cancelled only in PENDING state AND only if `total_paid = 0`

## Assumptions
- Persistence: in-memory store for simplicity. Code is layered to allow DB swap.
- Statuses: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
- Payments: tracked per order; multiple partial payments allowed
- Background job interval: configurable via `JOB_INTERVAL_MS` (default 300000 ms = 5 min)
- Payment operations are atomic with order state
- No concurrent payment processing (order state is consistent)

## Data Models

### Order
- id: string (UUID)
- items: array of { productId: string, quantity: integer, price: number }
- total: number (sum of item.price * item.quantity)
- totalPaid: number (cumulative sum of all payment amounts)
- status: string (PENDING | PROCESSING | SHIPPED | DELIVERED | CANCELLED)
- createdAt: ISO timestamp
- updatedAt: ISO timestamp

### Payment
- id: string (UUID)
- orderId: string (foreign key to Order)
- amount: number (must be > 0 and <= remaining balance)
- paymentDate: ISO timestamp
- paymentMethod: string (optional; e.g., "credit_card", "bank_transfer")

## HTTP API

Base: `http://localhost:3000` (Node) or `http://localhost:5000` (.NET)

### Order Endpoints

#### 1. Create Order
- **POST /orders**
- Body: `{ items: [ { productId, quantity, price }, ... ] }`
- Returns: 201 Created with Order (status=PENDING, totalPaid=0)

#### 2. Get Order by ID
- **GET /orders/:id**
- Returns: 200 OK with order or 404 if not found

#### 3. List Orders
- **GET /orders?status=PROCESSING**
- Query: status (optional, filter by status)
- Returns: 200 OK with array of orders

#### 4. Update Order Status (Admin/Operator)
- **PATCH /orders/:id/status**
- Body: `{ status: "PROCESSING" }`
- Returns: 200 OK with updated order or 400/404

#### 5. Cancel Order
- **PATCH /orders/:id/cancel**
- Rules: Allowed ONLY if status=PENDING AND totalPaid=0
- Returns: 200 OK with updated order (status=CANCELLED), 400 if conditions not met, 404 if not found

### Payment Endpoints

#### 6. Create Payment
- **POST /orders/:id/payments**
- Body: `{ amount: number, paymentMethod: string (optional) }`
- Validations:
  - amount > 0
  - amount <= (total - totalPaid) [prevent overpayment]
  - order must exist
  - order status must be PENDING
- Side Effect: If totalPaid becomes >= total after this payment, order is marked ready for processing (background job will transition it)
- Returns: 201 Created with `{ payment, order }` or 400/404

#### 7. Get Payments for Order
- **GET /orders/:id/payments**
- Returns: 200 OK with array of Payment records for this order

## Error Handling
- 400 Bad Request: validation errors (items required, invalid amount, overpayment, wrong status for cancellation)
- 404 Not Found: missing order
- 500 Internal Server Error: unexpected errors

## Background Job Behavior

Every `JOB_INTERVAL_MS` milliseconds:
1. Query all orders with status=PENDING
2. For each PENDING order, check condition: `totalPaid >= total`
3. If condition is TRUE, set status to PROCESSING and update timestamp
4. Log the transition
5. Continue looping

**Critical**: Orders transition to PROCESSING ONLY through this background job, not by manual operations (except admin PATCH if allowed).

## Runtime Configuration
- PORT (default 3000 for Node, 5000 for .NET)
- JOB_INTERVAL_MS (default 300000 = 5 minutes, in milliseconds)

## Notes for Implementer
- In-memory store allows quick prototyping. Swap with a proper DB (Postgres/Mongo) by replacing the store/repository.
- Background job uses non-blocking timer and updates are atomic at the store layer.
- Payment endpoint should validate both order existence and remaining balance.
- Cancellation strict validation ensures unpaid orders can be cancelled but paid orders cannot.
