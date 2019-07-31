'use strict';
const express = require("express");
const yaml = require('js-yaml');
const {readFileSync} = require('fs');

// Create a global config object.
var cfg = {};

// Set up Express.
var app = express();

// Start the server process.
async function init() {
  console.log("Loading configuration...");
  try {
    // Actually load our configuration.
    cfg = yaml.safeLoad(readFileSync('config.yml', 'utf8'));

    // Start listening for connections with Express.
    app.listen(cfg.service.listen_port, cfg.service.listen_address, () => {
     console.log("Server listening on " + cfg.service.listen_address + ":" + cfg.service.listen_port);
    });

    app.get("/:state/:city/temperature", (req, res, next) => {
      console.log("Request:" + req.connection.remoteAddress + " -> " + req.params.city + ", " + req.params.state);
      // TODO: Put out an actual response.
      res.json({'timestamp': new Date().toISOString(), 'temperature': 39});
    });

  } catch (e) {
    console.log("Failed to load configuration file:\n" + e);
    process.exit(1);
  }
}

console.log("Starting QuickWeather...");
init();
