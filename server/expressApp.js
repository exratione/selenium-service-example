/**
 * @fileOverview
 * The Express application.
 */

var http = require('http');
var path = require('path');
var express = require('express');
var config = require('../config');

//---------------------------------------------------------------------------
// Set up a very minimal Express application.
//---------------------------------------------------------------------------

var app = express();
// Serve a single static directory.
app.use(express.static(path.join(__dirname, 'static')));

//---------------------------------------------------------------------------
// Launch and export the server.
//---------------------------------------------------------------------------

var server = http.createServer(app).listen(config.server.port);
module.exports = server;
