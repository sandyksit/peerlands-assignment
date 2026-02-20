# Implementation Summary — Payment Feature

This document summarizes all the changes required to implement the payment feature across both Node.js and .NET applications based on the updated requirements.

## Documentation Updated

All specification and implementation documents have been updated to reflect payment requirements:

### Core Specifications
- [x] `docs/spec.md` - Updated with payment data models and endpoints
- [x] `docs/architecture.md` - Updated with payment workflow and database extension patterns
- [x] `docs/requirement.md` - Updated with new payment requirements (original source)

### API References
- [x] `docs/nodejs_api.md` - Added payment endpoints and examples
- [x] `docs/dotnet_api.md` - Added payment endpoints
- [x] `docs/payments_guide.md` - NEW comprehensive payment system guide with workflows and implementation checklist

### Developer Guides
- [x] `docs/nodejs_devguide.md` - Updated with payment implementation details
- [x] `docs/dotnet_devguide.md` - Updated with payment implementation details
- [x] `docs/dotnet_design_patterns.md` - Existing design patterns guide (still relevant)

## Requirements Checklist

### FROM requirement.md
- [x] Customers can place orders without making any payments
- [x] Orders remain in PENDING state until payment is completed
- [x] Customers can make multiple partial payments for an order
- [x] Order moves to PROCESSING ONLY when total payment equals total price
- [x] Background service handles the automatic transition

## Data Model Changes

### Order Entity Changes
| Field | Original | Updated |
|-------|----------|---------|
| id | string (UUID) | string (UUID) |
| items | Item[] | Item[] |
| total | number | number |
| **NEW: totalPaid** | - | number (sum of all payments) |
| status | string | string (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED) |
| createdAt | ISO timestamp | ISO timestamp |
| updatedAt | ISO timestamp | ISO timestamp |

### NEW Payment Entity
```
Payment
  - id: string (UUID)
  - orderId: string (links to Order)
  - amount: number (actual payment amount)
  - paymentDate: ISO timestamp
  - paymentMethod: string (optional, e.g., "credit_card")
```

## API Endpoint Changes

### NEW Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /orders/:id/payments | Create a payment for an order |
| GET | /orders/:id/payments | Get all payments for an order |

### UPDATED Endpoints
| Method | Path | Change |
|--------|------|--------|
| POST | /orders | totalPaid now initialized to 0 |
| GET | /orders | Orders now include totalPaid field |
| GET | /orders/:id | Order response includes totalPaid field |
| PATCH | /orders/:id/cancel | Now validates `totalPaid = 0` in addition to status = PENDING |

## Implementation Tasks — Node.js

### Models/Services
1. [ ] Update `src/services/orderService.js`:
   - [ ] Add `addPayment(orderId, amount, paymentMethod)` method
   - [ ] Add `getPayments(orderId)` method
   - [ ] Add validations: amount > 0, amount <= remaining balance, order exists, order status = PENDING
   - [ ] Update `createOrder()` to set totalPaid = 0
   - [ ] Update `cancelOrder()` to validate totalPaid = 0

### Store/Repository
1. [ ] Update `src/store/inMemoryStore.js`:
   - [ ] Add payment storage (e.g., `Map<string, Payment[]>`)
   - [ ] Add `savePayment(payment)` method
   - [ ] Add `getPayments(orderId)` method
   - [ ] Ensure atomic updates (payment + order update together)

### Controllers
1. [ ] Create `src/controllers/paymentController.js` OR add methods to `orderController.js`:
   - [ ] Add `createPayment(req, res)` handler
   - [ ] Add `getPayments(req, res)` handler

### Routes
1. [ ] Update `src/routes/orders.js`:
   - [ ] Add `router.post('/:id/payments', paymentController.createPayment)`
   - [ ] Add `router.get('/:id/payments', paymentController.getPayments)`

### Background Job
1. [ ] Update `src/jobs/scheduler.js`:
   - [ ] Change transition logic to check `order.totalPaid >= order.total`
   - [ ] Keep interval configurable via `JOB_INTERVAL_MS`

### Tests
1. [ ] Update `tests/`:
   - [ ] Add test for creating order (totalPaid=0)
   - [ ] Add test for partial payment
   - [ ] Add test for multiple payments
   - [ ] Add test for order auto-transition when paid in full
   - [ ] Add test for rejecting overpayment
   - [ ] Add test for rejecting payment on non-PENDING order
   - [ ] Add test for cancelling unpaid order (allowed)
   - [ ] Add test for cancelling paid order (rejected)

## Implementation Tasks — .NET

### Models
1. [ ] Add field to `Models/Order.cs`:
   - [ ] Add `public double TotalPaid { get; set; }`
   
2. [ ] Create `Models/Payment.cs`:
   - [ ] Id: string
   - [ ] OrderId: string
   - [ ] Amount: double
   - [ ] PaymentDate: DateTime
   - [ ] PaymentMethod: string (optional)

3. [ ] Create `Models/Dtos/PaymentCreateDto.cs`:
   - [ ] Amount: double
   - [ ] PaymentMethod: string (optional)

### Repository
1. [ ] Update `Repositories/IOrderRepository.cs`:
   - [ ] Add `Payment AddPayment(string orderId, Payment payment)`
   - [ ] Add `IEnumerable<Payment> GetPayments(string orderId)`

2. [ ] Update `Repositories/InMemoryOrderRepository.cs`:
   - [ ] Add `_payments` storage (e.g., `Dictionary<string, List<Payment>>`)
   - [ ] Implement `AddPayment()` method
   - [ ] Implement `GetPayments()` method

### Service
1. [ ] Update `Services/IOrderService.cs`:
   - [ ] Add `Payment AddPayment(string orderId, PaymentCreateDto dto)`
   - [ ] Add `IEnumerable<Payment> GetPayments(string orderId)`

2. [ ] Update `Services/OrderService.cs`:
   - [ ] Update `Create()` to set `TotalPaid = 0`
   - [ ] Update `Cancel()` to validate `TotalPaid == 0`
   - [ ] Implement `AddPayment()` with validations
   - [ ] Implement `GetPayments()`
   - [ ] Update `TransitionPendingToProcessing()` logic to check `TotalPaid >= Total`

### Controller
1. [ ] Update `Controllers/OrdersController.cs`:
   - [ ] Add `[HttpPost("{id}/payments")]` endpoint
   - [ ] Add `[HttpGet("{id}/payments")]` endpoint

### Background Service
1. [ ] Update `Jobs/OrderBackgroundService.cs`:
   - [ ] Change `TransitionPendingToProcessing()` logic to check `order.TotalPaid >= order.Total`

### Tests
1. [ ] Create `Tests/OrderServiceTests.cs` OR update existing:
   - [ ] Test creating order initializes totalPaid to 0
   - [ ] Test successful payment creation
   - [ ] Test overpayment rejection
   - [ ] Test payment on non-existent order (404)
   - [ ] Test payment on non-PENDING order (400)
   - [ ] Test multiple payments accumulating
   - [ ] Test background job transition with totalPaid >= total
   - [ ] Test cancellation with totalPaid = 0
   - [ ] Test cancellation rejection with totalPaid > 0

## Validation Rules to Implement

### Payment Validation (Create Payment)
```
1. Order must exist → 404 if missing
2. Order status must be PENDING → 400 if not
3. amount > 0 → 400 if not
4. amount <= (order.total - order.totalPaid) → 400 if overpayment
```

### Cancellation Validation (Update)
```
1. Order must exist → 404 if missing
2. Order status must be PENDING → 400 if not
3. Order.totalPaid must be 0 → 400 if paid (NEW)
```

### Background Job Logic (Update)
```
Before:
  if (order.status === 'PENDING') {
    order.status = 'PROCESSING';
  }

After:
  if (order.status === 'PENDING' && order.totalPaid >= order.total) {
    order.status = 'PROCESSING';
  }
```

## Testing Scenarios

### Scenario 1: Multi-payment workflow
```
1. Create order: total=100
2. Check: totalPaid=0, status=PENDING
3. Pay 30: totalPaid=30, status=PENDING
4. Pay 40: totalPaid=70, status=PENDING
5. Pay 30: totalPaid=100, status=PENDING
6. Wait 5+ min for job to run
7. Check: status=PROCESSING
```

### Scenario 2: Overpayment protection
```
1. Create order: total=100
2. Pay 50: success
3. Try to pay 60: FAIL - exceeds remaining (50)
4. Pay 50: success, totalPaid=100
```

### Scenario 3: Cancellation with payment
```
1. Create order: total=100
2. Cancel: success (totalPaid=0)
3. Create order: total=100
4. Pay 50: totalPaid=50
5. Cancel: FAIL - payment made, can't cancel
```

## Configuration

### Environment Variables (Unchanged)
- `PORT` - Server port (3000 for Node, 5000 for .NET)
- `JOB_INTERVAL_MS` - Background job interval in ms (default 300000)

For testing, use smaller interval:
```bash
# Node
JOB_INTERVAL_MS=1000 npm start

# .NET
$env:JOB_INTERVAL_MS=1000
dotnet run
```

## Deployment Considerations

### Data Migration
If deploying to existing system with orders:
- [ ] Set `totalPaid = 0` for all existing orders
- [ ] Assume no payment system existed before

### Database Extension
When migrating to persistent store:
- [ ] Create Payment table/collection
- [ ] Add totalPaid column to Order table
- [ ] Ensure foreign key Order → Payment
- [ ] Index on orderId for payments query

### API Versioning
- Consider versioning if clients depend on old API
- Or provide backward-compatible response shape

## Summary

✅ All documentation has been created and updated
⏳ Implementation in Node.js ( awaiting code changes)
⏳ Implementation in .NET (awaiting code changes)

Refer to `payments_guide.md` for detailed payment requirements and workflow examples.
Refer to `nodejs_devguide.md` and `dotnet_devguide.md` for implementation instructions specific to each platform.
