const orders = new Map();
const payments = new Map();

module.exports = {
  save(order) {
    orders.set(order.id, order);
  },

  getById(id) {
    return orders.get(id) || null;
  },

  list(status) {
    const all = Array.from(orders.values());
    if (!status) return all;
    return all.filter(o => o.status === status);
  },

  update(order) {
    if (!orders.has(order.id)) return null;
    orders.set(order.id, order);
    return order;
  },

  savePayment(payment) {
    if (!payments.has(payment.orderId)) {
      payments.set(payment.orderId, []);
    }
    payments.get(payment.orderId).push(payment);
    return payment;
  },

  getPayments(orderId) {
    return payments.get(orderId) || [];
  },

  clear() {
    orders.clear();
    payments.clear();
  }
};
