#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const debug = require('debug')('pingy');
const config = require('./config');
const Pingy = require('./index');
const argv = require('minimist')(process.argv.slice(2));

const saveConfig = (config) => fs.writeFileSync(path.resolve(process.env.HOME, '.pingyrc'), JSON.stringify(config, null, 2), { encoding: 'utf8' });

if (argv.help || argv.h) {
  console.log('Pingy pings the api at your request');
  console.log('\tInit:  pingy init --dsn=HOST --api-key=KEY');
  console.log('\nOptions: ');
  console.log('\-h | --help :  Help');
  console.log('\-k | --key :   The key to use to identity the job');
  console.log('\-a | --app :   The key to use to app related to the job');
  console.log('\-c : --create : Auto create the task and if needed');
  console.log('\nUsage: ');
  console.log('\tactions:  init | config | set | log | ping | start | finish | fail');
  console.log('\tPing a job:  pingy ping <job key or name>');
  console.log('\tStart a job:  pingy start <job key or name>');
  console.log('\tEnd sucessfully a job:  pingy end <job key or name>');
  console.log('\tFail a job:  pingy fail <job key or name>');
  console.log('\nConfig: ');
  console.log('\tDisplay config:  pingy config ');
  console.log('\tSet a config key:  pingy set <key> <value>');
  console.log('\tconfigs:  apiKey|dsn|autoCreate');
  process.exit(0);
}
if (argv._ && argv._.length) {
  const action = argv._[0];
  let key = argv.key || argv.k || (action !== 'set' ? argv._[1] : null);
  if (!key && (config.autoCreate || argv.c || argv.create)) {
    key = `${argv._[1]}-${os.hostname()}`;
  }
  const pingy = Pingy(key);
  switch (action) {
    case 'init':
      config.apiKey = argv['api-key'];
      config.dsn = argv['dsn'];
      saveConfig(config);
      break;
    case 'config':
      console.log(config);
      break;
    case 'set':
      if (argv._length === 1) {
        console.log('Usage: pingy set KEY VALUE');
        process.exit(0);
      }
      if (argv._length < 3) {
        throw new Error('Missing key and value');
      }
      config[argv._[1]] = argv._[2];
      saveConfig(config);
      break;
    case 'log':
      if (!config.dsn) {
        console.warn('Missing dsn in config');
      }
      if (!config.apiKey) {
        console.warn('Missing apiKey in config');
      }
      pingy[action](argv.log, { appname: argv.app || argv.a || undefined }).then((data) => {
        console.log('Pingy job id', data, data && data.id);
        return data;
      }).catch(console.error);
      break;
    case 'ping':
    default:
    case 'start':
    case 'finish':
    case 'fail':
      if (!config.dsn) {
        console.warn('Missing dsn in config');
      }
      if (!config.apiKey) {
        console.warn('Missing apiKey in config');
      }
      pingy[action]({ appname: argv.app || argv.a || undefined }).then((data) => {
        console.log('Pingy job id', data, data && data.id);
        return data;
      }).catch(console.error);
      break;
  }
}
