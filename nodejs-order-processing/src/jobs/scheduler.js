const OrderService = require('../services/orderService');

let intervalId = null;

function start() {
  if (intervalId) return;
  const ms = parseInt(process.env.JOB_INTERVAL_MS || '300000', 10);
  intervalId = setInterval(() => {
    try {
      const updated = OrderService.transitionPendingToProcessing();
      if (updated.length) console.log(`Job: moved ${updated.length} orders to PROCESSING`);
    } catch (err) {
      console.error('Job error', err && err.stack);
    }
  }, ms);
  console.log(`Background job started, interval ${ms}ms`);
}

function stop() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
}

module.exports = { start, stop };
