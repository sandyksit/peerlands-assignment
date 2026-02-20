const express = require('express');
const bodyParser = require('body-parser');
const ordersRouter = require('./routes/orders');
const jobScheduler = require('./jobs/scheduler');
const config = require('./config');
const logger = require('./utils/logger');

const app = express();
app.use(bodyParser.json());
app.use('/orders', ordersRouter);

// health check
app.get('/', (req, res) => res.json({ ok: true }));

// start background job
jobScheduler.start();

logger.info(`App initialized with config: port=${config.port}, jobInterval=${config.jobIntervalMs}ms`);

module.exports = app;

