'use strict';

const Influx = require('influx');

const { schema } = require('./database-schema.js');

function createInfluxDatabase(configurationDatabaseParams = {}) {
    const defaultParams = {
        database: 'uptime-checker',
    };
    return new Influx.InfluxDB(
        Object.assign(defaultParams, configurationDatabaseParams, { schema })
    );
}

module.exports = { createInfluxDatabase };

