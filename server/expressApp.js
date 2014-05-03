/**
 * @fileOverview
 * The Express application.
 */

var http = require('http');
var path = require('path');
var express = require('express');

/**
 * Launch a very minimal Express server.
 *
 * @param {Object} config
 *   A configuration object.
 * @return {Object}
 *   An http.Server instance.
 */
exports.start = function (config) {
  console.log('Starting local web server...');

  //---------------------------------------------------------------------------
  // Set up a very minimal Express application.
  //---------------------------------------------------------------------------

  var app = express();
  // Serve a single static directory.
  app.use(express.static(path.join(__dirname, 'static')));

  //---------------------------------------------------------------------------
  // Launch and export the server.
  //---------------------------------------------------------------------------

  this.server = http.createServer(app).listen(config.server.port);

  console.log('Local web server started.');
  return this.server;
};

/**
 * Stop the Express server if it exists.
 */
exports.stop = function (callback) {
  if (!this.server) {
    return callback();
  }
  console.log('Halting local web server...');
  exports.server.close(function () {
    console.log('Local web server halted.');
    callback();
  });
};
