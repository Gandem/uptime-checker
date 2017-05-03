/**
 * @fileoverview Helper to check if a configuration file is accurate
 * @module config/config-validator
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

// The JOI module API is found here:
// https://github.com/hapijs/joi/blob/master/API.md

const joi = require('joi');
const urlRegex = require('url-regex');

const debug = require('debug')('uptime-checker:config');

const { ERROR_MESSAGES } = require('../util/errors.js');

// ------------------------------------------------------------------------------
// Configuration Schema
// ------------------------------------------------------------------------------

const websiteConfigurationSchema = joi
    .object()
    .keys({
        url: joi.string().regex(urlRegex({ exact: true })),
        // https://nodejs.org/api/http.html#http_http_request_options_callback
        httpOptions: joi.object(),
        checkInterval: joi.number(),
    })
    .requiredKeys('url')
    .optionalKeys('checkInterval', 'httpOptions');

const generalConfigurationSchema = joi
    .object()
    .keys({
        website: joi.array().items(websiteConfigurationSchema).single(),
        checkInterval: joi.number(),
        // The configuration that is passed to influxdb
        // https://node-influx.github.io/typedef/index.html#static-typedef-ISingleHostConfig
        database: joi.object(),
    })
    .optionalKeys('checkInterval', 'database')
    .requiredKeys('website');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Validates the configurationObject according to the schema
 * It also automatically coerces string-numbers to numbers
 * @param {Object} configurationObject Object representation of the configuration file
 * @returns {Promise} A Promise to the configurationObject
 * @resolve {Object} The configurationObject
 * @reject {Error} The error indicating why configuration is invalid
 */
function validateConfiguration(configurationObject) {
    debug('Validating configuration');

    return joi.validate(configurationObject, generalConfigurationSchema, (error, value) => {
        if (error !== null) {
            debug(`Configuration is invalid \n ${error.message}`);
            error.message = ERROR_MESSAGES.CONFIGURATION_OBJECT_STATICALLY_INVALID(error);
            return error;
        }
        return value;
    });
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { validateConfiguration };

