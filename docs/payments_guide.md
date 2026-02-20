# Payment System - Implementation Guide

This guide explains the payment system requirements and how it integrates with orders.

## Overview

Customers can pay for orders in multiple partial payments. An order only transitions from PENDING to PROCESSING when the total amount paid equals or exceeds the total order price. This is enforced by the background job, not by the payment endpoint itself.

## Payment Flow

### Step 1: Customer Creates Order (No Payment Required)
```
POST /orders
Body: { items: [{ productId: "p1", quantity: 2, price: 50 }] }
Response: Order { id: "...", total: 100, totalPaid: 0, status: "PENDING" }
```
- Order is created with totalPaid = 0
- Customer is not required to pay immediately
- Order stays in PENDING status

### Step 2: Customer Makes First Partial Payment
```
POST /orders/{id}/payments
Body: { amount: 60, paymentMethod: "credit_card" }
Response: {
  payment: { id: "...", orderId: "...", amount: 60, paymentDate: "...", paymentMethod: "credit_card" },
  order: { id: "...", totalPaid: 60, status: "PENDING", ... }
}
```
- Payment recorded, order.totalPaid becomes 60
- Order still PENDING (because 60 < 100)
- Customer can continue shopping or pay later

### Step 3: Customer Makes Second Payment (Complete Payment)
```
POST /orders/{id}/payments
Body: { amount: 40, paymentMethod: "bank_transfer" }
Response: {
  payment: { id: "...", orderId: "...", amount: 40, paymentDate: "...", paymentMethod: "bank_transfer" },
  order: { id: "...", totalPaid: 100, status: "PENDING", ... }
}
```
- Payment recorded, order.totalPaid becomes 100
- Order still PENDING (background job hasn't run yet)
- Customer has now paid in full

### Step 4: Background Job Runs (Auto-Transition)
- Job detects order with totalPaid (100) >= total (100)
- Sets status to PROCESSING, updates timestamp
- Order can now be shipped

### Step 5: Query Order to See Updated Status
```
GET /orders/{id}
Response: {
  id: "...",
  total: 100,
  totalPaid: 100,
  status: "PROCESSING",  // <-- Changed by background job
  items: [...],
  createdAt: "...",
  updatedAt: "..."
}
```

## API Endpoints

### POST /orders/:id/payments - Create Payment

**Request:**
```json
{
  "amount": 50,
  "paymentMethod": "credit_card"  // optional
}
```

**Validations:**
1. `amount` must be > 0
   - Error: `{ error: "Amount must be greater than 0" }` (400)
2. `amount` must not exceed remaining balance (`total - totalPaid`)
   - Error: `{ error: "Payment amount exceeds remaining balance. Remaining: 40, Provided: 50" }` (400)
3. Order must exist
   - Error: `{ error: "Order not found" }` (404)
4. Order status must be PENDING
   - Error: `{ error: "Cannot pay for orders that are not in PENDING status" }` (400)

**Success Response (201 Created):**
```json
{
  "payment": {
    "id": "uuid-string",
    "orderId": "order-uuid",
    "amount": 50,
    "paymentDate": "2026-02-20T10:30:00Z",
    "paymentMethod": "credit_card"
  },
  "order": {
    "id": "order-uuid",
    "items": [{ "productId": "p1", "quantity": 2, "price": 50 }],
    "total": 100,
    "totalPaid": 50,
    "status": "PENDING",
    "createdAt": "2026-02-20T10:00:00Z",
    "updatedAt": "2026-02-20T10:30:00Z"
  }
}
```

### GET /orders/:id/payments - List Payments for Order

**Request:**
```
GET /orders/{id}/payments
```

**Response (200 OK):**
```json
[
  {
    "id": "payment-uuid-1",
    "orderId": "order-uuid",
    "amount": 60,
    "paymentDate": "2026-02-20T10:30:00Z",
    "paymentMethod": "credit_card"
  },
  {
    "id": "payment-uuid-2",
    "orderId": "order-uuid",
    "amount": 40,
    "paymentDate": "2026-02-20T11:00:00Z",
    "paymentMethod": "bank_transfer"
  }
]
```

**If order not found (404):**
```json
{ "error": "Order not found" }
```

## Data Model

### Payment Entity
```javascript
{
  id: string (UUID),                    // unique payment ID
  orderId: string (UUID),               // links to Order
  amount: number,                       // payment amount in currency units
  paymentDate: ISO timestamp,           // when payment was made
  paymentMethod: string (optional),     // e.g. "credit_card", "bank_transfer", "paypal"
}
```

### Order (Updated with Payment)
```javascript
{
  id: string (UUID),
  items: Array<{ productId, quantity, price }>,
  total: number,                        // sum of all item totals
  totalPaid: number,                    // NEW: sum of all payment amounts
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp
}
```

## Important Business Rules

### Rule 1: Payments Only for PENDING Orders
- Cannot make payments for PROCESSING, SHIPPED, DELIVERED, or CANCELLED orders
- Once order transitions to PROCESSING, payment endpoint rejects further payments

### Rule 2: No Overpayment
- Cannot pay more than remaining balance
- Example: Order total = 100, already paid = 60, max payment = 40
- If customer tries to pay 50, reject with error

### Rule 3: Order Transition Driven by Payment Total
- Order does NOT automatically transition when payment equals total
- Background job checks every JOB_INTERVAL_MS (default 5 minutes)
- Job transitions when `totalPaid >= total` (not `==`)
- This accommodates overpayment scenarios (though prevented by validation)

### Rule 4: Cancellation Rules with Payment
- Order can be cancelled ONLY if:
  - Status is PENDING
  - totalPaid is 0 (no payments made)
- Once any payment is made, order cannot be cancelled
- Example workflow:
  ```
  Order created (totalPaid=0, status=PENDING) → CAN cancel
  Payment made (totalPaid=50, status=PENDING) → CANNOT cancel
  Order fully paid (totalPaid=100, status=PENDING) → Auto-transitions to PROCESSING → CANNOT cancel
  ```

## Implementation Checklist

### Data Layer (Store/Repository)
- [ ] Add `totalPaid` field to Order
- [ ] Create Payment data structure
- [ ] Implement payment storage (list per order or flat with filters)
- [ ] Implement `addPayment(orderId, amount, paymentMethod)` method
- [ ] Implement `getPayments(orderId)` method
- [ ] Ensure atomic updates when adding payment (update order + save payment together)

### Service Layer
- [ ] Update `createOrder` to set totalPaid = 0
- [ ] Create `addPayment(orderId, amount, paymentMethod)` method with validations:
  - [ ] Order exists
  - [ ] Order status is PENDING
  - [ ] Amount > 0
  - [ ] Amount <= remaining balance
- [ ] Update `cancelOrder` to check totalPaid = 0
- [ ] Update background job to check `totalPaid >= total` instead of time-based logic

### Route/Controller Layer
- [ ] Add route `POST /orders/:id/payments`
- [ ] Add route `GET /orders/:id/payments`
- [ ] Validate request body (amount is required and positive)
- [ ] Return proper status codes (201, 400, 404)
- [ ] Return payment object along with updated order

### Testing
- [ ] Test successful payment creation
- [ ] Test overpayment rejection
- [ ] Test payment on non-existent order (404)
- [ ] Test payment on non-PENDING order (400)
- [ ] Test background job transition with partial payment
- [ ] Test background job transition with full payment
- [ ] Test multiple payments accumulating
- [ ] Test cancellation with zero payment
- [ ] Test cancellation rejection with any payment

## Example Test Scenarios

### Scenario 1: Partial Payments
```
1. Create order: total=100, totalPaid=0
2. Pay 30: totalPaid=30, status=PENDING
3. Pay 40: totalPaid=70, status=PENDING
4. Pay 30: totalPaid=100, status=PENDING
5. (5+ min later) Background job runs
6. Query order: status=PROCESSING
```

### Scenario 2: Try to Overpay
```
1. Create order: total=100
2. Pay 50: success, totalPaid=50
3. Pay 60: FAIL - "Amount exceeds remaining balance. Remaining: 50"
4. Pay 50: success, totalPaid=100
5. Try to pay 10 more: FAIL - Order now PROCESSING, can't pay
```

### Scenario 3: Ordered but Cancelled Before Paying
```
1. Create order: total=100, totalPaid=0
2. Cancel order: success, status=CANCELLED
3. Try to pay: FAIL - Order is not PENDING
```

## Configuration

Environment variables:
- `JOB_INTERVAL_MS=300000` (5 minutes) - How often background job runs
- For testing, reduce to `JOB_INTERVAL_MS=1000` (1 second)
