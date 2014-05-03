/**
 * @fileOverview
 * Configuration for running parallel tests.
 *
 * To get started running this example setup:
 *
 * 1) Register an account with either BrowserStack, SauceLabs, or TestingBot.
 * 2) Set the service property to the service you are using.
 * 3) Enter your account name and key, or key and secret, into the service
 *    definition below.
 *
 * Then launch tests on the command line:
 *
 * node runTests
 */

module.exports = {
  // ------------------------------------------------------------------------
  // Specify the cloud Selenium service used.
  // ------------------------------------------------------------------------

  // Values: browserstack|saucelabs|testingbot
  service: 'browserstack',

  // ------------------------------------------------------------------------
  // General settings for all services.
  // ------------------------------------------------------------------------

  // Are we using the example server included here? Set this to false if
  // experimenting with your own tests and server.
  launchExampleServer: true,

  // The web server to run tests against.
  server: {
    protocol: 'http',
    host: 'localhost',
    port: 10080
  },

  // Configuration passed directly to Mocha.
  mocha: {
    timeout: 20 * 1000,
    slow: 10 * 1000,
    reporter: 'json-stream'
  },

  // Log settings.
  log: {
    // Relative to the project directory.
    directory: 'logs',
    workerLogPrefix: 'test-process-'
  },

  // Workers will be spawned to run the tests in parallel. Here define which
  // test files each worker will use.
  //
  // File paths can be expressed as globs, and are relative to the project
  // directory. e.g.: 'test/**/*.test.js'
  workers: [
    ['test/testSuiteA.test.js'],
    ['test/testSuiteB.test.js']
  ],

  // ------------------------------------------------------------------------
  // BrowserStack settings.
  // ------------------------------------------------------------------------

  browserstack: {
    // Copy in the user and key from the Automate section of your BrowserStack
    // account.
    user: '',
    key: '',

    // The endpoint to connect to the WebDriver interface.
    selenium: {
      host: 'hub.browserstack.com',
      port: 80
    },

    // Webdriver capabililites for Firefox 26 on Windows 8. See the BrowserStack
    // site for further capabilities and options.
    capabilities: {
      browser: 'Firefox',
      browser_version: '26.0',
      os: 'Windows',
      os_version: '8',
      // Uncomment for greater logging from the tunnel process.
      // 'browserstack.debug' : true,
      'browserstack.tunnel': true,
      // These will be set automatically based on the user and key provided,
      // and the generated unique tunnel ID. They are noted here for reference
      // purposes - you don't need to edit them.
      'browserstack.tunnelIdentifier': undefined,
      'browserstack.user': undefined,
      'browserstack.key': undefined
    },

    tunnel: {
      // Path to the tunnel binary.
      path: 'lib/BrowserStackLocal-2.0-linux-x64',
      // Log file name. It will be written to the general log directory.
      logfile: 'browserstack.log',
      // Milliseconds to wait for the SSH tunnel connection to be established.
      timeout: 120 * 1000
    }
  },

  // ------------------------------------------------------------------------
  // SauceLabs settings.
  // ------------------------------------------------------------------------

  saucelabs: {
    // Copy in the username and key from your SauceLabs account.
    user: '',
    key: '',

    // The endpoint to connect to the WebDriver interface.
    selenium: {
      host: 'localhost',
      port: 4445
    },

    // Webdriver capabililites for Firefox 26 on Windows 8. See the SauceLabs
    // site for further capabilities and options.
    capabilities: {
      browserName: 'firefox',
      version: '26',
      platform : 'Windows 8',
      // This will be set automatically based the generated unique tunnel ID.
      // It is noted here for reference purposes - you don't need to edit it.
      'tunnel-identifier': undefined
    },

    tunnel: {
      // Path to the tunnel binary.
      path: 'lib/sc-4.1-linux/bin/sc',
      // Log file name. It will be written to the general log directory.
      logfile: 'saucelabs.log',
      // Milliseconds to wait for the SSH tunnel connection to be established,
      // which will usually require instantiation of a dedicated Selenium cloud
      // server.
      timeout: 120 * 1000,
      // Local port to send Selenium commands to. With a tunnel you can either
      // use the remote SauceLabs API or the tunnel endpoint; either will work.
      seleniumPort: 4445
    }
  },

  // ------------------------------------------------------------------------
  // TestingBot settings.
  // ------------------------------------------------------------------------

  testingbot: {
    // Copy in the key and secret from your TestingBot account.
    key: '',
    secret: '',

    // The endpoint to connect to the WebDriver interface.
    selenium: {
      host: 'localhost',
      port: 4445
    },

    // Webdriver capabililites for Firefox 26 on Windows. See the TestingBot
    // site for further capabilities and options.
    capabilities: {
      browserName: 'firefox',
      version: '26',
      platform: 'WINDOWS'
    },

    tunnel: {
      // Path to the tunnel JAR file.
      path: 'lib/testingbot-tunnel-1.14/testingbot-tunnel.jar',
      // Log file name. It will be written to the general log directory.
      logfile: 'testingbot.log',
      // Milliseconds to wait for the SSH tunnel connection to be established,
      // which will usually require instantiation of a dedicated Selenium cloud
      // server.
      timeout: 120 * 1000,
      // Local port to send Selenium commands to. With a tunnel you can either
      // use the remote SauceLabs API or the tunnel endpoint; either will work.
      seleniumPort: 4445
    }
  }
};

