'use strict';

/*
 * This file is used to interface with the PostgreSQL database.
 * This file is part of QuickWeather by Josh Lucy <joshlucy@gmail.com>
 */

const { Pool } = require('pg');

var db_ready = false;
var cfg = {};

async function init(config) {
  cfg = config;

  const pool = new Pool({
    connectionString: "postgres://{cfg.posgres.user}:{cfg.posgres.password}@{cfg.posgres.host}:{cfg.posgres.port}/{cfg.posgres.database}"
  });

  pool.on('connect', () => {
    db_ready = true;
    console.log('Connected to the Postres database.');
  });
}
