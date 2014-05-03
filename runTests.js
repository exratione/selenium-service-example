/**
 * @fileOverview
 *
 * Use this script to run the example tests:
 *
 * node runTests
 */

var master = require('./src/master');

var configPath = './config';
if (process.argv.length < 3) {
  console.log('No configuration file path provided. Using default: ' + configPath);
} else {
  configPath = process.argv[2];
  console.log('Using provided configuration file path: ' + configPath);
}

master.run(configPath, function (error, incompleteTestProcessCount, failedTestCount) {
  console.log('---------------------------------------------');
  console.log('RESULTS');
  console.log('---------------------------------------------');

  if (error) {
    console.error('An error occurred in the test control process:');
    console.error(error.stack);
    process.exit(1);
  }

  if (!incompleteTestProcessCount && !failedTestCount) {
    console.log('Tests passed.');
    process.exit(0);
  }

  if (incompleteTestProcessCount) {
    console.error('' + incompleteTestProcessCount + ' test processes failed to complete. See the test logs.');
  }
  if (failedTestCount) {
    console.error('' + failedTestCount + ' tests failed. See the test logs.');
  }
  process.exit(1);
});
