const OrderService = require('../services/orderService');
const config = require('../config');
const logger = require('../utils/logger');

let intervalId = null;

function start() {
  if (intervalId) return;
  const ms = config.jobIntervalMs;
  intervalId = setInterval(() => {
    try {
      const updated = OrderService.transitionPendingToProcessing();
      if (updated.length) logger.info(`Job: moved ${updated.length} orders to PROCESSING`);
    } catch (err) {
      logger.error('Job error', err && err.stack);
    }
  }, ms);
  logger.info(`Background job started, interval ${ms}ms`);
}

function stop() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  logger.info('Background job stopped');
}

module.exports = { start, stop };
