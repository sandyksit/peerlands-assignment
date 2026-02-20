const OrderService = require('../services/orderService');

const create = (req, res) => {
  try {
    const order = OrderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const list = (req, res) => {
  const status = req.query.status;
  const orders = OrderService.listOrders(status);
  res.json(orders);
};

const get = (req, res) => {
  const order = OrderService.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};

const updateStatus = (req, res) => {
  try {
    const updated = OrderService.updateStatus(req.params.id, req.body.status);
    res.json(updated);
  } catch (err) {
    if (err.message === 'not found') return res.status(404).json({ error: 'Order not found' });
    res.status(400).json({ error: err.message });
  }
};

const cancel = (req, res) => {
  try {
    const updated = OrderService.cancelOrder(req.params.id);
    res.json(updated);
  } catch (err) {
    if (err.message === 'not found') return res.status(404).json({ error: 'Order not found' });
    res.status(400).json({ error: err.message });
  }
};

const addPayment = (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const payment = OrderService.addPayment(req.params.id, amount, paymentMethod);
    res.status(201).json(payment);
  } catch (err) {
    if (err.message === 'not found') return res.status(404).json({ error: 'Order not found' });
    res.status(400).json({ error: err.message });
  }
};

const getPayments = (req, res) => {
  try {
    const payments = OrderService.getPayments(req.params.id);
    res.json(payments);
  } catch (err) {
    if (err.message === 'not found') return res.status(404).json({ error: 'Order not found' });
    res.status(400).json({ error: err.message });
  }
};

module.exports = { create, list, get, updateStatus, cancel, addPayment, getPayments };
