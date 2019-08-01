'use strict';
const db = require("./db.js");
const express = require("express");
const {readFileSync} = require('fs');
const request = require("request");
const util = require("util");
const yaml = require('js-yaml');
const weather = require('openweather-apis');

// Create a global config object.
console.log("Loading configuration...");
const cfg = yaml.safeLoad(readFileSync('config.yml', 'utf8'));

// Set up OpenWeatherMap API key
weather.setAPPID(cfg.openWeatherApi.appid);

// Set up Express.
const app = express();

// Start listening for connections with Express.
app.listen(cfg.service.listen_port, cfg.service.listen_address, () => {
  console.log("Server listening on " + cfg.service.listen_port);
});

// Handle incoming requests for the state/city/temperature GET route.
app.get("/:state/:city/temperature", (req, res, next) => {
  console.log("Request:" + req.connection.remoteAddress + " -> " + req.params.city + ", " + req.params.state);
  let query = util.format("?format=json&q=%s,%s,us", req.params.city, req.params.state);
  let options = {
    url: util.format("%s/%s", cfg.openStreetMap.base_url, query),
    method: "GET",
    headers: {
      "User-Agent": cfg.service.user_agent
    }
  };

  request(options, (error, response, body) => {
    if (error) {
      console.log(error);
      JSON.
    } else {
      // Go with the first result.
      const place_data = JSON.parse(body);
      const lat = Number(place_data[0]['lat']);
      const lon = Number(place_data[0]['lon']);
      weather.setCoordinate(lat, lon);
    }
  });

  weather.getTemperature(function(err, temp) {
    res.json({'timestamp': new Date().toISOString(), 'temperature': temp});
  });
});
