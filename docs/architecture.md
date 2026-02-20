# Architecture Overview

This project implements a modular, layered backend (Node.js and .NET) to satisfy order processing and payment requirements.

## High-level Components

### Core Modules
- **api/routes** (HTTP layer): Express-based routes (Node) or ASP.NET Controllers (.NET) that validate input and delegate to service layer
- **services**: Business logic (create order, cancel, list, update status, process payment)
- **repositories/store**: In-memory or DB-backed data persistence; easy to replace
- **jobs/scheduler**: Background worker that transitions PENDING orders to PROCESSING when payment is complete
- **tests**: Unit tests for services and API endpoints
- **models/entities**: Order, Payment, Item data structures

### Layering
```
HTTP Layer (Routes/Controllers)
    ↓
Business Logic (Services)
    ↓
Data Access (Repositories/Store)
    ↓
In-Memory Store / Database
```

## Design Patterns Used
1. **Repository Pattern**: Abstract data access; easy to swap implementations
2. **Service Layer**: Encapsulate business rules (validation, payment logic, status transitions)
3. **Dependency Injection**: Loose coupling of layers
4. **DTO Pattern**: Separate API contracts from domain models
5. **Background Service**: Periodic job for order status transitions
6. **Singleton Pattern**: In-memory store and services live for app lifetime

## Order & Payment Workflow

### Sequence: Create Order
1. Client POST /orders with items
2. Route validates request, calls OrderService.create
3. Service constructs order (computes total), calls Store.save
4. Order created with status=PENDING, totalPaid=0
5. API returns 201 with order JSON

### Sequence: Make Payment
1. Client POST /orders/{id}/payments with amount
2. Route validates amount, calls OrderService.addPayment
3. Service validates:
   - order exists
   - order status is PENDING (can't pay for processing/shipped orders)
   - amount > 0 and <= remaining balance (total - totalPaid)
4. Service creates Payment record, stores in repository
5. Service updates order.totalPaid by adding payment amount
6. Service checks: if totalPaid >= total, order is ready for processing (mark flag or let job detect)
7. API returns 201 with payment + updated order
8. Background job eventually detects and transitions to PROCESSING

### Sequence: Background Job (Auto-Transition)
1. Job wakes every JOB_INTERVAL_MS
2. Queries store for orders with status=PENDING
3. For each PENDING order:
   - Check if totalPaid >= total
   - If TRUE, set status=PROCESSING, update timestamp
   - Log the transition
4. Sleep until next interval

### Sequence: Cancel Order
1. Client PATCH /orders/{id}/cancel
2. Route calls OrderService.cancel(id)
3. Service validates:
   - order exists
   - status = PENDING
   - totalPaid = 0 (no payments made)
4. If valid, set status=CANCELLED, update timestamp
5. If invalid, throw error
6. API returns 200 (success) or 400 (validation error)

## Data Persistence

### In-Memory Store (Default)
- `Map<string, Order>` for orders
- `Map<string, Payment[]>` for payments per order  (or flat `Map<string, Payment>` by payment.id)
- `ConcurrentDictionary` in .NET
- Thread-safe for concurrent requests
- Persists per request, lost on app restart

### Extending to Database
1. Create `SqlOrderRepository` implementing `IOrderRepository`
2. Use Entity Framework Core (.NET) or Sequelize/TypeORM (Node)
3. Implement `List`, `GetById`, `Save`, `Update`, `AddPayment`, `GetPayments` methods
4. Register in DI instead of `InMemoryOrderRepository`
5. Existing code (Services, Controllers) requires no changes

### Repository Interface
Should support:
- CRUD for orders
- Query by status
- Add/retrieve payments for an order
- Atomic updates (order + payment together)

## Key Assumptions & Constraints
- **No Concurrent Payments**: Only one payment processed per order at a time (queue or lock)
- **Idempotent Reads**: Payments are immutable once created
- **Atomic Operations**: Payment + order update must be atomic
- **No Status Downgrades**: PROCESSING → PENDING not allowed
- **Cancellation Rules**: Only PENDING + unpaid orders can be cancelled
- **Background Job**: Non-blocking, runs independently, no guarantee of exact timing (JOB_INTERVAL_MS is approximate)
- **Order Ownership**: In this simple system, any client can view/pay any order (add auth in production)

## Error Handling Strategy
- **Validation Errors**: Return 400 Bad Request early in route handler
- **Business Rule Violations**: Service throws typed exceptions, caught in controller
- **Not Found**: Return 404 for missing orders/resources
- **Unexpected**: Log error, return 500

## Extending with New Features
Example: Add OrderRefund endpoint
1. Create `RefundService` or add to `OrderService`
2. Implement refund logic (check status, validate amount, create Refund record)
3. Add route in controller/router
4. Update store to track refunds if needed
5. Service and route handle all validation and persistence

