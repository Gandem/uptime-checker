/**
 * @fileoverview Function to create a connection to the database
 * @module database
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const Influx = require('influx');

const { schema } = require('./database-schema.js');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Create a database connection instance
 * @param {Object} configurationDatabaseParams Database configuration options
 * @return {Object} An Object wrapping the database methods
 */
function createInfluxDatabase(configurationDatabaseParams = {}) {
    const defaultParams = {
        database: 'uptime-checker',
    };
    return new Influx.InfluxDB(
        Object.assign(defaultParams, configurationDatabaseParams, { schema })
    );
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { createInfluxDatabase };

