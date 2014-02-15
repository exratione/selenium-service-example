/**
 * @fileOverview
 * A worker that runs tests.
 *
 * This is called with the following arguments:
 *
 * 1) index in the array of test files in config/index.js.
 * 2) base64 encoded copy of the amended configuration.
 */

var path = require('path');
var async = require('async');
var chai = require('chai');
var glob = require('glob');
var Mocha = require('mocha');
var wd = require('wd');

// ---------------------------------------------------------------------------
// Set up Promise style integration between mocha, wd, and chai.
// ---------------------------------------------------------------------------

// See the test scripts for the syntax this then enables. Or see examples at:
// https://github.com/admc/wd/blob/master/examples/promise/mocha-specs.js
require('mocha-as-promised')();
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
// Enables chai assertion chaining.
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

// ---------------------------------------------------------------------------
// Read in arguments.
// ---------------------------------------------------------------------------

var index = parseInt(process.argv[2], 10);
var config = new Buffer(process.argv[3], 'base64').toString('utf8');
config = JSON.parse(config);
var service = config.service;

if (isNaN(index)) {
  throw new Error('Invalid worker index argument provided: ' + process.argv[2]);
}

// ---------------------------------------------------------------------------
// Set up useful global parameters accessible to test files.
// ---------------------------------------------------------------------------

global.config = config;
switch (service) {
  case 'browserstack':
    global.browser = wd.promiseChainRemote(
      config[service].selenium.host,
      config[service].selenium.port
    );
    break;

  case 'saucelabs':
    global.browser = wd.promiseChainRemote(
      config[service].selenium.host,
      config[service].selenium.port,
      config[service].user,
      config[service].key
    );
    break;

  case 'testingbot':
    global.browser = wd.promiseChainRemote(
      config[service].selenium.host,
      config[service].selenium.port,
      config[service].key,
      config[service].secret
    );
    break;

  default:
    throw new Error('Invalid service: ' + service);
}

// ---------------------------------------------------------------------------
// Get on with the testing.
// ---------------------------------------------------------------------------

var mocha = new Mocha(config.mocha);

// Expand the glob path specifications into paths and add them to Mocha.
config.workers[index].forEach(function (thisGlob) {
  glob.sync(thisGlob).forEach(function (filePath) {
    filePath = path.join(__dirname, '..', filePath);
    mocha.addFile(filePath);
  });
});

var failureCount;

async.series({
  initializeBrowser: function (asyncCallback) {
    global.browser.init(config[service].capabilities, asyncCallback);
    global.browser.on('status', function(info) {
      console.log(info);
    });
    global.browser.on('command', function(meth, path, data) {
      console.log(meth, path, data || '');
    });
  },
  runTests: function (asyncCallback) {
    mocha.run(function (returnedFailureCount) {
      failureCount = returnedFailureCount;
      asyncCallback();
    });
  }
}, function (error) {
  // Close off the browser whatever happened.
  global.browser.quit();

  if (error) {
    console.log(error);
    process.exit(1);
  }

  // Message the parent process to tell it what happened.
  process.send({
    failureCount: failureCount
  });

  if (failureCount) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
