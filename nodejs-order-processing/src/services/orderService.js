const store = require('../store/inMemoryStore');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

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
      totalPaid: 0,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.save(order);
    logger.info(`Order created: ${order.id}, total: ${total}, totalPaid: 0`);
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
    logger.info(`Order ${id} status updated to ${status}`);
    return order;
  },

  cancelOrder(id) {
    const order = store.getById(id);
    if (!order) throw new Error('not found');
    if (order.status !== 'PENDING') throw new Error('only PENDING orders can be cancelled');
    if (order.totalPaid > 0) throw new Error('cannot cancel order with existing payments');
    order.status = 'CANCELLED';
    order.updatedAt = new Date().toISOString();
    store.update(order);
    logger.info(`Order ${id} cancelled`);
    return order;
  },

  transitionPendingToProcessing() {
    const pending = store.list('PENDING');
    const updated = [];
    pending.forEach(order => {
      if (order.totalPaid >= order.total) {
        order.status = 'PROCESSING';
        order.updatedAt = new Date().toISOString();
        store.update(order);
        updated.push(order);
        logger.info(`Order ${order.id} transitioned to PROCESSING (paid: ${order.totalPaid}/${order.total})`);
      }
    });
    return updated;
  },

  addPayment(orderId, amount, paymentMethod = 'unknown') {
    const order = store.getById(orderId);
    if (!order) throw new Error('not found');
    if (order.status !== 'PENDING') throw new Error('payments can only be made for PENDING orders');
    if (typeof amount !== 'number' || amount <= 0) throw new Error('amount must be a positive number');
    const remaining = order.total - order.totalPaid;
    if (amount > remaining) throw new Error(`overpayment: cannot pay ${amount}, remaining balance is ${remaining}`);
    
    const payment = {
      id: uuidv4(),
      orderId,
      amount,
      paymentDate: new Date().toISOString(),
      paymentMethod,
    };
    
    const savedPayment = store.savePayment(payment);
    order.totalPaid += amount;
    order.updatedAt = new Date().toISOString();
    store.update(order);
    
    logger.info(`Payment added to order ${orderId}: amount=${amount}, totalPaid=${order.totalPaid}`);
    return savedPayment;
  },

  getPayments(orderId) {
    const order = store.getById(orderId);
    if (!order) throw new Error('not found');
    return store.getPayments(orderId);
  }
};

module.exports = OrderService;
