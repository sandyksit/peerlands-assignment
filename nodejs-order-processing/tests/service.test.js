const assert = require('assert');
const store = require('../src/store/inMemoryStore');
const OrderService = require('../src/services/orderService');

function run() {
  store.clear();

  // Create order
  const o = OrderService.createOrder({ items: [ { productId: 'p1', quantity: 2, price: 10 } ] });
  assert.strictEqual(o.total, 20);
  assert.strictEqual(o.status, 'PENDING');

  // cannot cancel if not pending? it is pending so should work
  const cancelled = OrderService.cancelOrder(o.id);
  assert.strictEqual(cancelled.status, 'CANCELLED');

  // create another and transition
  const o2 = OrderService.createOrder({ items: [ { productId: 'p2', quantity: 1, price: 5 } ] });
  const moved = OrderService.transitionPendingToProcessing();
  assert.strictEqual(moved.length >= 1, true);

  console.log('service tests passed');
}

if (require.main === module) run();

module.exports = run;
