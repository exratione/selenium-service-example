/**
 * @fileOverview
 * Master test runner.
 *
 * Provides functions to:
 *
 * 1) launch an Express web server,
 * 2) launch and shutdown SSH tunnels,
 * 3) launch multiple test subprocesses.
 */

var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');
var async = require('async');
var uuid = require('uuid');
var expressApp = require('../server/expressApp');

//---------------------------------------------------------------------------
// Properties that will be set.
//---------------------------------------------------------------------------

exports.config = undefined;
// HttpServer instance.
exports.server = undefined;
// The child process instance running the SSH tunnel.
exports.tunnelProcess = undefined;
// To hold the test runner processes to be spawned.
exports.testProcesses = [];

//---------------------------------------------------------------------------
// Run everything.
//---------------------------------------------------------------------------

/**
 * Setup the server, SSH tunnel, and run the tests.
 *
 * @param {String} configPath
 *   Path to configuration, to be passed to require(). Relative to the upper
 *   directory of the project.
 * @param {Function} callback
 *   Of the form function function (error, incompleteTestProcessCount, failedTestCount).
 */
exports.run = function (configPath, callback) {
  var self = this;
  async.series({
    readConfiguration: function (asyncCallback) {
      self.readConfiguration(configPath, asyncCallback);
    },
    ensureLogDirectory: function (asyncCallback) {
      self.ensureLogDirectory(asyncCallback);
    },
    startServer: function (asyncCallback) {
      self.startServer(asyncCallback);
    },
    startTunnel: function (asyncCallback) {
      self.startTunnel(asyncCallback);
    },
    runTestProcesses: function (asyncCallback) {
      self.runTestProcesses(asyncCallback);
    },
    stopTunnel: function (asyncCallback) {
      self.stopTunnel(asyncCallback);
    },
    stopServer: function (asyncCallback) {
      self.stopServer(asyncCallback);
    }
  }, function (error) {
    // Meaning we had an issue somewhere in the control code, and probably
    // didn't even launch the tests.
    if (error) {
      return self.handleError(error, function () {
        callback(error);
      });
    }

    var incompleteTestProcessCount = 0;
    var failedTestCount = 0;

    exports.testProcesses.forEach(function (testProcess) {
      if(testProcess.complete) {
        failedTestCount += testProcess.failureCount;
      } else {
        incompleteTestProcessCount++;
      }
    });
    callback(null, incompleteTestProcessCount, failedTestCount);
  });
};

//---------------------------------------------------------------------------
// Manage issues and errors.
//---------------------------------------------------------------------------

/**
 * Shut everything down on error.
 *
 * The callback is optional, but this will end the process without it. If
 * provided, the error will be passed through to the callback.
 *
 * @param {Error} error
 * @param {Function} [callback]
 */
exports.handleError = function (error, callback) {
  var self = this;
  console.error('An error occurred. Halting testing.');

  async.series({
    haltTestProcesses: function (asyncCallback) {
      self.haltTestProcesses(asyncCallback);
    },
    stopTunnel: function (asyncCallback) {
      self.stopTunnel(asyncCallback);
    },
    stopServer: function (asyncCallback) {
      self.stopServer(asyncCallback);
    }
  }, function (shutdownError) {
    if (shutdownError) {
      console.error('A further error occurred while halting testing:');
      console.error(shutdownError.stack);
    }
    if (callback) {
      callback(error);
    } else {
      console.error(error.stack);
      process.exit(1);
    }
  });
};

//---------------------------------------------------------------------------
// Other utilities.
//---------------------------------------------------------------------------

/**
 * Read the configuration file to be used.
 *
 * @param {String} configPath
 *   Path to configuration, to be passed to require(). Relative to the upper
 *   directory of the project.
 * @param {Function} callback
 *   Of the form function function (error).
 */
exports.readConfiguration = function (configPath, callback) {
  try {
    this.config = require(path.join(__dirname, '..', configPath));
    callback();
  } catch (error) {
    callback(new Error('Invalid configuration file path: ' + configPath));
  }
};

/**
 * Create a logs directory if it doesn't exist.
 *
 * @param {Function} callback
 */
exports.ensureLogDirectory = function (callback) {
  var logDir = path.join(__dirname, '..', 'logs');
  fs.exists(logDir, function (exists) {
    if (exists) {
      callback();
    } else {
      fs.mkdir(logDir, callback);
    }
  });
};

//---------------------------------------------------------------------------
// Express server.
//---------------------------------------------------------------------------

/**
 * Launch the Express server.
 *
 * We are running it in this process, which should be fine as it won't be
 * doing much in the way of heavy lifting.
 */
exports.startServer = function (callback) {
  if (this.config.launchExampleServer) {
    expressApp.start(this.config);
  }
  callback();
};

/**
 * Stop the Express server.
 */
exports.stopServer = function (callback) {
  expressApp.stop(callback);
};

//---------------------------------------------------------------------------
// SSH Tunnel management.
//---------------------------------------------------------------------------

/**
 * Launch a BrowserStack SSH tunnel instance.
 *
 * @param {Function} callback
 */
exports.launchBrowserStackTunnel = function (callback) {
  var self = this;
  var callbackInvoked = false;

  if(!this.config.browserstack.user) {
    return callback(new Error('Missing config.browserstack.user.'));
  }
  if(!this.config.browserstack.key) {
    return callback(new Error('Missing config.browserstack.key.'));
  }

  console.log('Launching BrowserStack SSH tunnel. It might take a minute for a remote Selenium server to be ready...');

  // BrowserStack requires specification of all servers that will be accessed
  // through the tunnel. If you don't list yours, then it won't work.
  //
  // Here we only care about the localhost server, but you can list more than
  // one server:
  // host1,port1,ssl1,host2,port2,ssl2,etc ...
  var hostString = [
    this.config.server.host,
    this.config.server.port,
    // Indicating that this is not an SSL connection.
    0
  ].join(',');

  var args = [
    this.config.browserstack.key,
    hostString,
    // Uncomment for verbose logging - not a great deal of difference with this
    // tunnel, however.
    // '-v',
    '-tunnelIdentifier',
    this.config.browserstack.tunnel.identifier,
    // Disable Live Testing and Screenshots, just test with Automate.
    '-onlyAutomate',
    // Skip checking for the validity of the folder/hosts parameters. This is
    // usually advisable, as you might want to fire up the tunnel before the
    // thing you are testing is ready, so as to save time.
    '-skipCheck'
  ];

  this.tunnelProcess = childProcess.spawn(this.config.browserstack.tunnel.path, args, {
    cwd: path.join(__dirname, '..')
  });

  // Pipe both stdout and stderr to the specified log file.
  var logFilePath = path.join(__dirname, '..', this.config.log.directory, this.config.browserstack.tunnel.logfile);
  var writer = fs.createWriteStream(logFilePath);
  this.tunnelProcess.stderr.pipe(writer);
  this.tunnelProcess.stdout.pipe(writer);

  // Set up a timeout watch to shut down if the tunnel setup hangs - which does
  // happen, though not often.
  var timeoutId = setTimeout(function () {
    self.tunnelProcess.removeListener('data', readyListener);
    callbackInvoked = true;
    callback(new Error('Timed out waiting for SSH tunnel to initialize.'));
  }, this.config.browserstack.tunnel.timeout);

  /**
   * A listener function for the tunnel. Callback when the tunnel outputs a
   * ready message.
   *
   * @param {Buffer} data
   */
  function readyListener (data) {
    if (data.toString().match(/You can now access your local server/)) {
      console.log('BrowserStack SSH tunnel launched and ready.');
      // Get rid of this listener and the timeout function.
      self.tunnelProcess.removeListener('data', readyListener);
      clearTimeout(timeoutId);
      // And onwards.
      callbackInvoked = true;
      callback();
    }
  }
  this.tunnelProcess.stdout.on('data', readyListener);

  // If the tunnel exits for any reason before the stopTunnel() method is
  // called than that is an error condition.
  this.tunnelProcess.on('exit', function (code) {
    // This might happen before readiness, so get rid of this listener and the
    // timeout function.
    self.tunnelProcess.removeListener('data', readyListener);
    clearTimeout(timeoutId);
    delete self.tunnelProcess;

    // And if it does happen before readiness, then we should make sure the
    // callback still happens.
    var error = new Error('SSH tunnel exited unexpectedly with code: ' + code);
    if (callbackInvoked) {
      self.handleError(error);
    } else {
      callbackInvoked = true;
      callback(error);
    }
  });
};

/**
 * Launch a SauceLabs SSH tunnel instance.
 *
 * @param {Function} callback
 */
exports.launchSauceLabsTunnel = function(callback) {
  var self = this;
  var callbackInvoked = false;

  if(!this.config.saucelabs.user) {
    return callback(new Error('Missing config.saucelabs.user.'));
  }
  if(!this.config.saucelabs.key) {
    return callback(new Error('Missing config.saucelabs.key.'));
  }

  console.log('Launching SauceLabs SSH tunnel. It might take a minute for a remote Selenium server to be ready...');

  // The process will touch a file when the remote Selenium server has started
  // and it is ready for use.
  var readyFilePath = path.join(__dirname, this.config.saucelabs.tunnel.identifier + '-ready');
  var logFile = path.join(__dirname, '..', this.config.log.directory, this.config.saucelabs.tunnel.logfile);

  var args = [
    '--user',
    this.config.saucelabs.user,
    '--api-key',
    this.config.saucelabs.key,
    // Uncomment for verbose logging.
    // '--verbose',
    '--tunnel-identifier',
    this.config.saucelabs.tunnel.identifier,
    // Apparently this doesn't work - so we're using pipes from the process
    // below.
    //'--logfile',
    //logFile,
    '--readyfile',
    readyFilePath,
    '--se-port',
    this.config.saucelabs.tunnel.seleniumPort,
  ];

  this.tunnelProcess = childProcess.spawn(this.config.saucelabs.tunnel.path, args, {
    cwd: path.join(__dirname, '..')
  });

  // Pipe both stdout and stderr to the specified log file.
  var writer = fs.createWriteStream(logFile);
  this.tunnelProcess.stderr.pipe(writer);
  this.tunnelProcess.stdout.pipe(writer);

  // Set up a timeout watch to shut down if the tunnel setup hangs - which does
  // happen, though not often.
  var timeoutId = setTimeout(function () {
    clearInterval(checkReadyId);
    callbackInvoked = true;
    callback(new Error('Timed out waiting for SSH tunnel to initialize.'));
  }, this.config.saucelabs.tunnel.timeout);

  // Set up a periodic check for the existence of the readyfile.
  var checkReadyId = setInterval(function () {
    fs.exists(readyFilePath, function (exists) {
      if (exists) {
        console.log('SauceLabs SSH tunnel launched and ready.');
        fs.unlink(readyFilePath, function () {});
        clearTimeout(timeoutId);
        clearInterval(checkReadyId);
        callbackInvoked = true;
        callback();
      }
    });
  }, 1000);

  // If the tunnel exits for any reason before the stopTunnel() method is
  // called than that is an error condition.
  this.tunnelProcess.on('exit', function (code) {
    // This might happen before readiness, so get rid of the various timeout
    // and interval functions.
    clearTimeout(timeoutId);
    clearInterval(checkReadyId);
    delete self.tunnelProcess;

    // And if it does happen before readiness, then we should make sure the
    // callback still happens.
    var error = new Error('SSH tunnel exited unexpectedly with code: ' + code);
    if (callbackInvoked) {
      self.handleError(error);
    } else {
      callbackInvoked = true;
      callback(error);
    }
  });
};

/**
 * Launch a TestingBot SSH tunnel instance.
 *
 * @param {Function} callback
 */
exports.launchTestingBotTunnel = function(callback) {
  var self = this;
  var callbackInvoked = false;

  if(!this.config.testingbot.key) {
    return callback(new Error('Missing config.testingbot.key.'));
  }
  if(!this.config.testingbot.secret) {
    return callback(new Error('Missing config.testingbot.secret.'));
  }

  console.log('Launching TestingBot SSH tunnel. It might take a minute for a remote Selenium server to be ready...');

  // The process will touch a file when the remote Selenium server has started
  // and it is ready for use.
  var readyFilePath = path.join(__dirname, this.config.testingbot.tunnel.identifier + '-ready');
  var logFile = path.join(__dirname, '..', this.config.log.directory, this.config.testingbot.tunnel.logfile);

  // Note that tunnel identifier isn't passed in the arguments.
  var args = [
    '-jar',
    this.config.testingbot.tunnel.path,
    this.config.testingbot.key,
    this.config.testingbot.secret,
    // Supposedly makes the tunnel faster, but it simply doesn't work if this is
    // enabled.
    //'--boost',
    '--readyfile',
    readyFilePath,
    '--se-port',
    this.config.testingbot.tunnel.seleniumPort,
  ];

  this.tunnelProcess = childProcess.spawn('java', args, {
    cwd: path.join(__dirname, '..')
  });

  // Pipe both stdout and stderr to the specified log file.
  var writer = fs.createWriteStream(logFile);
  this.tunnelProcess.stderr.pipe(writer);
  this.tunnelProcess.stdout.pipe(writer);

  // Set up a timeout watch to shut down if the tunnel setup hangs - which does
  // happen, though not often.
  var timeoutId = setTimeout(function () {
    clearInterval(checkReadyId);
    callbackInvoked = true;
    callback(new Error('Timed out waiting for SSH tunnel to initialize.'));
  }, this.config.testingbot.tunnel.timeout);

  // Set up a periodic check for the existence of the readyfile.
  var checkReadyId = setInterval(function () {
    fs.exists(readyFilePath, function (exists) {
      if (exists) {
        console.log('TestingBot SSH tunnel launched and ready.');
        fs.unlink(readyFilePath, function () {});
        clearTimeout(timeoutId);
        clearInterval(checkReadyId);
        callbackInvoked = true;
        callback();
      }
    });
  }, 1000);

  // If the tunnel exits for any reason before the stopTunnel() method is
  // called than that is an error condition.
  this.tunnelProcess.on('exit', function (code) {
    // This might happen before readiness, so get rid of the various timeout
    // and interval functions.
    clearTimeout(timeoutId);
    clearInterval(checkReadyId);
    delete self.tunnelProcess;

    // And if it does happen before readiness, then we should make sure the
    // callback still happens.
    var error = new Error('SSH tunnel exited unexpectedly with code: ' + code);
    if (callbackInvoked) {
      self.handleError(error);
    } else {
      callbackInvoked = true;
      callback(error);
    }
  });
};

/**
 * Start the appropriate SSH tunnel.
 *
 * The callback is invoked when the tunnel is ready for use, which requires
 * waiting for the remote Selenium server to become available.
 *
 * @param {Function} callback
 */
exports.startTunnel = function (callback) {
  var capabilities;

  switch (this.config.service) {
    case 'browserstack':
      // Fill out necessary configuration.
      this.config.browserstack.tunnel.identifier = uuid.v4();
      capabilities = this.config.browserstack.capabilities;
      capabilities['browserstack.tunnelIdentifier'] = this.config.browserstack.tunnel.identifier;
      capabilities['browserstack.user'] = this.config.browserstack.user;
      capabilities['browserstack.key'] = this.config.browserstack.key;
      // Then on to launching the tunnel process.
      this.launchBrowserStackTunnel(callback);
      break;

    case 'saucelabs':
      // Fill out necessary configuration.
      this.config.saucelabs.tunnel.identifier = uuid.v4();
      capabilities = this.config.saucelabs.capabilities;
      capabilities['tunnel-identifier'] = this.config.saucelabs.tunnel.identifier;
      // Then on to launching the tunnel process.
      this.launchSauceLabsTunnel(callback);
      break;

    case 'testingbot':
      // Fill out necessary configuration.
      this.config.testingbot.tunnel.identifier = uuid.v4();
      // Then on to launching the tunnel process.
      this.launchTestingBotTunnel(callback);
      break;

    default:
      callback(new Error('Invalid service specified: ' + this.config.service));
      break;
  }
};

/**
 * Stop the tunnel if it is running.
 *
 * @param {Function} callback
 */
exports.stopTunnel = function (callback) {
  var self = this;
  if (!this.tunnelProcess) {
    return callback();
  }

  console.log('Halting SSH tunnel...');

  // Get rid of the error listener we put on the tunnel process.
  this.tunnelProcess.removeAllListeners('exit');
  // Sends a SIGTERM to the process, but we should wait for it to clean up.
  // Immediately killing a Selenium service SSH tunnel can lead to issues with
  // some of the services.
  this.tunnelProcess.kill();

  function callbackOnTunnelProcessExit() {
    // The _handle property on a child process is set null when the process
    // ends. This isn't a public property, so may evaporate in some future
    // Node.js release, but it is useful.
    if (self.tunnelProcess._handle) {
      return;
    }

    clearInterval(intervalId);
    delete self.tunnelProcess;
    callback();
  }

  console.log('SSH tunnel sent kill signal, waiting for it to shut down.');
  var intervalId = setInterval(callbackOnTunnelProcessExit, 1000);
};

//---------------------------------------------------------------------------
// Run tests in subprocesses.
//---------------------------------------------------------------------------

/**
 * Launch the test runner subprocesses.
 */
exports.runTestProcesses = function (callback) {
  var self = this;

  function onExit(wrapper, code) {
    console.log('Test process ' + wrapper.index + ' exited with code ' + code);
    wrapper.code = code;
    delete wrapper.process;

    var complete = self.testProcesses.every(function (processWrapper) {
      return !processWrapper.process;
    });
    if (complete) {
      callback();
    }
  }

  this.testProcesses = this.config.workers.map(function (paths, index) {
    console.log('Launching test process ' + index);
    // Spawn a worker process, sending over the index and the base64 encoded
    // configuration to work with.
    var testProcess = childProcess.fork('./src/worker', [
      index,
      new Buffer(JSON.stringify(self.config)).toString('base64')
    ], {
      cwd: path.join(__dirname, '..'),
      silent: true
    });

    var wrapper = {
      complete: false,
      index: index,
      process: testProcess
    };

    testProcess.on('exit', function (code) {
      onExit(wrapper, code);
    });

    testProcess.on('message', function (message) {
      wrapper.complete = true;
      wrapper.failureCount = message.failureCount;
    });

    var logFile = path.join(__dirname, '..', self.config.log.directory, self.config.log.workerLogPrefix + index + '.log');
    var writer = fs.createWriteStream(logFile);
    testProcess.stderr.pipe(writer);
    testProcess.stdout.pipe(writer);

    return wrapper;
  });
};

/**
 * Halt all the test runner subprocesses.
 */
exports.haltTestProcesses = function (callback) {
  this.testProcesses.filter(function (testProcessHolder) {
    return !!testProcessHolder.process;
  }).forEach(function (testProcessHolder) {
    testProcessHolder.process.removeAllListeners('exit');
    testProcessHolder.process.kill();
    // Distinctive code for being shut down.
    testProcessHolder.code = 10;
    delete testProcessHolder.process;
  });
  callback();
};
