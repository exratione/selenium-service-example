/**
 * @fileOverview
 *
 * Use this script to run the example tests:
 *
 * node runTests
 */

var master = require('./src/master');

master.run(function (error, incompleteTestProcessCount, failedTestCount) {
  console.log('---------------------------------------------');
  console.log('RESULTS');
  console.log('---------------------------------------------');

  if (error) {
    console.error('An error occurred in the test control process:');
    console.error(error.toString());
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
