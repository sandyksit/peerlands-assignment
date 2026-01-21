const store = require('../store/inMemoryStore');
const { v4: uuidv4 } = require('uuid');

const VALID_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function computeTotal(items) {
  return items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('items must be a non-empty array');
  items.forEach(it => {
    if (!it.productId) throw new Error('item.productId required');
    if (!Number.isInteger(it.quantity) || it.quantity <= 0) throw new Error('item.quantity must be integer > 0');
    if (typeof it.price !== 'number' || it.price < 0) throw new Error('item.price must be number >= 0');
  });
}

const OrderService = {
  createOrder(data) {
    const items = data.items;
    validateItems(items);
    const total = computeTotal(items);
    const order = {
      id: uuidv4(),
      items,
      total,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.save(order);
    return order;
  },

  getOrder(id) {
    return store.getById(id);
  },

  listOrders(status) {
    return store.list(status);
  },

  updateStatus(id, status) {
    if (!VALID_STATUSES.includes(status)) throw new Error('invalid status');
    const order = store.getById(id);
    if (!order) throw new Error('not found');
    order.status = status;
    order.updatedAt = new Date().toISOString();
    store.update(order);
    return order;
  },

  cancelOrder(id) {
    const order = store.getById(id);
    if (!order) throw new Error('not found');
    if (order.status !== 'PENDING') throw new Error('only PENDING orders can be cancelled');
    order.status = 'CANCELLED';
    order.updatedAt = new Date().toISOString();
    store.update(order);
    return order;
  },

  transitionPendingToProcessing() {
    const pending = store.list('PENDING');
    const updated = [];
    pending.forEach(order => {
      order.status = 'PROCESSING';
      order.updatedAt = new Date().toISOString();
      store.update(order);
      updated.push(order);
    });
    return updated;
  }
};

module.exports = OrderService;
