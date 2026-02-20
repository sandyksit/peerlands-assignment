# Node.js Developer Guide

## Project Layout
- `src/server.js` - Express app wiring and job start  
- `src/app.js` - Main app file
- `src/routes/orders.js` - HTTP routes
- `src/controllers/orderController.js` - Route handlers (NEW: thin controllers)
- `src/services/orderService.js` - Business logic (orders + payments)  
- `src/store/inMemoryStore.js` - In-memory repository
- `src/jobs/scheduler.js` - Background job for order transitions
- `src/config/index.js` - Configuration management
- `src/utils/logger.js` - Logging utility
- `tests/` - Unit and integration tests

## Running Locally
```bash
cd nodejs-order-processing
npm install
npm start
```

Or with custom job interval:
```bash
JOB_INTERVAL_MS=1000 npm start
```

## Payment System Implementation

The order service now supports payments:

### Add Payment Method to Service
```javascript
addPayment(orderId, amount, paymentMethod) {
  // Validate order exists & is PENDING
  // Validate amount > 0 and <= remaining balance
  // Create Payment record
  // Update order.totalPaid
  // Return payment + updated order
}
```

### Update Background Job Logic
The background job checks if `totalPaid >= total`:
```javascript
const updated = OrderService.transitionPendingToProcessing();
// Now only transitions orders where totalPaid >= total
```

### Update Cancellation Logic
```javascript
cancelOrder(id) {
  const order = store.getById(id);
  // Check: status === 'PENDING' && totalPaid === 0
  // If false, throw error
  // If true, proceed with cancellation
}
```

## How to Swap the Store for a DB

1. Implement a new store adapter:
   ```javascript
   // src/store/sqlStore.js
   class SqlOrderRepository {
     async save(order) { /* use query builder */ }
     async getById(id) { /* query by id */ }
     async list(status) { /* query with filter */ }
     async update(order) { /* update query */ }
     async addPayment(orderId, payment) { /* insert payment */ }
     async getPayments(orderId) { /* query payments */ }
   }
   ```

2. Update `orderService.js` to use the new store:
   ```javascript
   const store = require('../store/sqlStore'); // swap this line
   ```

## Testing

Run all tests:
```bash
npm test
```

For quick feedback, set a short job interval:
```bash
JOB_INTERVAL_MS=1000 npm test
```

Test scenarios:
- Create order without payment (should be PENDING)
- Make partial payment
- Make multiple payments
- Verify order auto-transitions when full
- Cancel unpaid order (allow)
- Cancel paid order (reject)

## Coding Conventions

- Use CommonJS modules (require/exports)
- Keep controllers thin, put validation in services
- Use descriptive error messages
- Log important operations using logger utility
- Validate inputs early in controllers

## Key Files for Payment Feature

| File | Change |
|------|--------|
| `services/orderService.js` | Add `addPayment()` method |
| `store/inMemoryStore.js` | Add payment storage & retrieval |
| `controllers/orderController.js` | Add payment endpoint handlers |
| `routes/orders.js` | Add `/payments` routes |
| `jobs/scheduler.js` | Update logic to check `totalPaid >= total` |

See `payments_guide.md` for detailed payment requirements.