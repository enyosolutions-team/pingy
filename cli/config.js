const os = require('os');

const conf = require('rc')('pingy', {
  host: process.platform,
  platform: process.platform,
  pid: process.pid,
  hostname: os.hostname(),
  apiKey: process.env.PINGY_API_KEY,
  dsn: process.env.PINGY_DSN,
});

module.exports = conf;
