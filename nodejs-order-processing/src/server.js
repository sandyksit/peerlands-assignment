const express = require('express');
const bodyParser = require('body-parser');
const ordersRouter = require('./routes/orders');
const jobScheduler = require('./jobs/scheduler');

const app = express();
app.use(bodyParser.json());

app.use('/orders', ordersRouter);

// health
app.get('/', (req, res) => res.json({ ok: true }));

// start background jobs
jobScheduler.start();

module.exports = app;
