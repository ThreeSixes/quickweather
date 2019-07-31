'use strict';

const yaml = require('js-yaml');
const {readFileSync} = require('fs');

// Start the server process.
async function init() {
  console.log("Loading configuration...");
  try {
    var cfg = yaml.safeLoad(readFileSync('config.yml', 'utf8'));
  } catch (e) {
    console.log("Failed to load configuration file:\n" + e);
    process.exit(1);
  }
}

console.log("Starting QuickWeather...");
init();
