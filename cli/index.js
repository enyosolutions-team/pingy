const axios = require('axios');
const util = require('util');
const debug = require('debug')('pingy');
const config = require('./config');


/**
 * Pingy
 *
 * @class Pingy
 */
class Pingy {
  constructor(jobKey = null, appName = null, extraConfig = {}) {
    this.jobId = null;
    // the job key is the name of the job or the file where the job is running
    this.jobKey = jobKey || process.argv[1] || Date.now();
    this.tags = {};
    if (appName) {
      this.setAppName(appName);
    }
    this.config = config;
    this.config = {
      ...this.config,
      ...(extraConfig || {}),
      apiKey: undefined,
      dsn: undefined,
      'api-key': undefined,
    };
    // this shoud create a new job
  }
  /**
   *
   *
   * @memberof Pingy
  */
  init(config) {
    if (!config) {
      return
    }
    const { dsn, apiKey } = config;
    config.dsn = dsn || config.dsn;
    config.apiKey = apiKey || config.apiKey;
  }

  setTag(key, value) {
    if (!this.tags) {
      this.tags = {};
    }
    this.tags[key] = value;
  }

  setAppName(value) {
    this.setTag('appname', value);
  }

  send(data = {}) {
    if (!config.dsn) {
      console.warn('Missing dsn in config');
    }
    if (!config.apiKey) {
      console.warn('Missing apiKey in config');
    }


    if (!this.jobKey) {
      throw new Error('Missing key');
    }
    const url = config.dsn;
    const body = {
      ...data,
      ...(this.tags || {}),
      key: this.jobKey,
      hostname: config.hostname,

      appname: data.appname || undefined,
      pid: process.pid,
      status: data.status || undefined,
      context: {
        ...config,
        platform: config.platform,
        apiKey: undefined,
        dsn: undefined,
        _: undefined,

      },
    };

    if (this.jobId) {
      body.id = this.jobId;
    }
    debug('PING MONITORING', {
      url,
      jobId: this.jobId,
      body,
    });
    if (!config.dsn) {
      return Promise.resolve();
    }
    return axios({
      url,
      method: 'POST',
      json: true,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
      data: body,
    }).then(({ data }) => {
      debug('PING MONITORING RESULT', data)
      if (data.event.id) {
        this.jobId = data.event.id
      }
      return data.event;
    }).catch((err) => {
      console.error('[ERROR] pingy', err.message, err.response && err.response.data);
    });
  }

  start(data = {}) {
    this.jobId = null;
    return this.send({ ...data, status: 'started' });
  }

  finish(data) { return this.send({ ...data, status: 'finished' }); }
  end(data) { return this.send({ ...data, status: 'finished' }); }
  ping(data) { return this.send({ ...data, status: 'running' }); }
  log(obj, ...rest) {
    if (obj instanceof Error) {
      return this.send({
        log: err && err.message,
        level: 'warn',
      });
    }
    else if (typeof obj === 'string') {
      return this.send({
        log: util.format(obj, ...rest),
        level: 'info',
        status: 'running'
      });
    }
    else {
      return this.send({
        log: JSON.stringify(obj, null, 2),
        level: obj.level || 'info',
        status: 'running'
      });
    }
  }
  /**
   *
   *
   * @param {*} obj
   * @returns
   * @memberof Pingy
   */
  error(obj) {
    if (obj instanceof Error) {
      return this.send({
        log: err && err.message,
        level: 'error',
      });
    }
    else if (typeof obj === 'string') {
      return this.send({
        log: obj,
        level: 'error',
        status: 'running'
      });
    }
    else {
      return this.send({
        log: JSON.stringify(obj, null, 2),
        level: obj.level || 'error',
        status: 'running',
        level: 'error',
      });
    }
  }
  /**
   *
   * @param {*} data
   * @param {*} err
   */
  fail(data = {}, err) {
    if (!data) {
      data = {};
    }
    if (data instanceof Error) {
      err = data;
      data = {};
    }
    this.send({ ...data, status: 'failed', logs: (data.logs || []).push(err && err.message) });
  }
}
module.exports = (...args) => new Pingy(...args);
