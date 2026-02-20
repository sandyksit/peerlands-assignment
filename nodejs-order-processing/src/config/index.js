require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  jobIntervalMs: parseInt(process.env.JOB_INTERVAL_MS || '300000', 10),
};
