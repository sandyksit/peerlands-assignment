const express = require('express');
const router = express.Router();
const OrderService = require('../services/orderService');

router.post('/', (req, res) => {
  try {
    const order = OrderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  const status = req.query.status;
  const orders = OrderService.listOrders(status);
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = OrderService.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.patch('/:id/status', (req, res) => {
  try {
    const updated = OrderService.updateStatus(req.params.id, req.body.status);
    res.json(updated);
  } catch (err) {
    if (err.message === 'not found') return res.status(404).json({ error: 'Order not found' });
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/cancel', (req, res) => {
  try {
    const updated = OrderService.cancelOrder(req.params.id);
    res.json(updated);
  } catch (err) {
    if (err.message === 'not found') return res.status(404).json({ error: 'Order not found' });
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
