const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.create);
router.get('/', orderController.list);
router.get('/:id', orderController.get);
router.patch('/:id/status', orderController.updateStatus);
router.patch('/:id/cancel', orderController.cancel);

module.exports = router;
