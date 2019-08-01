'use strict';
const express = require("express");
const {readFileSync} = require('fs');
const request = require("request");
const {temperature_cache} = require('./models/index');
const util = require("util");
const yaml = require('js-yaml');
const weather = require('openweather-apis');

// Create a global config object.
console.log("Loading configuration...");

// Port to config mgmt and secrets mgmt.
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
  // Do we need to cache this data?
  let needsCached = false;

  // When did the request come in?
  let now = new Date();

  // Figure out when our request came in.
  let requestTimestamp = now.toISOString();

  // Find a place to hold the ID for our cache record in case we need to update it.
  let cachedId = null;

  console.log("Request: " + req.connection.remoteAddress + " -> " + req.params.city + ", " + req.params.state + " @ " + requestTimestamp);

  // See if we can find an entry in the cache already.
  temperature_cache
    .findAndCountAll({
       where: {
          city: req.params.city.toLowerCase().replace(/[^\w\s]/gi, ''),
          state: req.params.state.toLowerCase().replace(/[^\w\s]/gi, '')
       }
    })
    .then(result => {
      // See if we have a cache hit.
      if (result.count == 1) {
        needsCached = false;

        // Has our item expired?
        if (now.getTime() > result.rows[0]['dataValues']['expires']) {
          console.log("Cache expired.");

          // Get the ID of the cache item we'll have to udpate
          // and flag that we need to cache the results.
          cachedId = result.rows[0]['dataValues']['id'];
          needsCached = true;

        } else {
          console.log("Cache hit.");
          // Just return the data we have in cache.
          res.json({
            'timestamp': requestTimestamp,
            'temperature': result.rows[0]['dataValues']['temperature']}
          );
          needsCached = false;
        }
      } else if (result.count > 1) {
          console.log("WARNING: " + result.count + " duplicate cache entries.");
      } else {
        needsCached = true;
        console.log("Cache missed.");
      }
    }).then(()=>{
      // If we need to get and cache our temperature data...
      if (needsCached == true) {
        // Create the necessary parameters to query the OSM geocoding service.
        let query = util.format("?format=json&q=%s,%s,us", req.params.city, req.params.state);
        let options = {
          url: util.format("%s/%s", cfg.openStreetMap.base_url, query),
          method: "GET",
          headers: {
            "User-Agent": cfg.service.user_agent
          }
        };

        console.log("Geocoding location.");
        // Attempt to geocode the request.
        request(options, (error, response, body) => {
          if (error) {
            console.log("Error geocoding: " + error);
            res.status(500).send(JSON.stringlify({'error': 'Could not geocode location.'}));
          } else {
            // Attempt to get the latitude and longitude of the most relevant place.
            try {
              // Go with the first result.
              const place_data = JSON.parse(body);
              const lat = Number(place_data[0]['lat']);
              const lon = Number(place_data[0]['lon']);

              // Set our present location.
              weather.setCoordinate(lat, lon);
            }

            catch(err) {
              console.log("Error with geocoding results: " + error);
              res.status(500).send("Failed to get latitude and longitude of location.");
            }
          }
        });

        console.log("Getting temperature.");
        weather.getTemperature(function(err, temp) {
          res.json({'timestamp': requestTimestamp, 'temperature': temp});

          // Compute cached item expiry time.
          var expiryTime = now.getTime() + (1000 * cfg.cache.temperature_max_age);

          // Upsert data to the cache.
          temperature_cache.upsert(
          {
            id: cachedId,
            city: req.params.city.toLowerCase().replace(/[^\w\s]/gi, ''),
            state: req.params.state.toLowerCase().replace(/[^\w\s]/gi, ''),
            temperature: temp,
            expires: Number(expiryTime)
          }, {});

        });
      }
    });
});
