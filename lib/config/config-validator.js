/**
 * @fileoverview Helper to check if a configuration file is accurate
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
        port: joi.number().min(1).max(65535),
        check_interval: joi.number(),
    })
    .requiredKeys('url')
    .optionalKeys('check_interval', 'port');

const generalConfigurationSchema = joi
    .object()
    .keys({
        website: joi.array().items(websiteConfigurationSchema).single(),
        check_interval: joi.number(),
    })
    .optionalKeys('check_interval')
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
            error.message = ERROR_MESSAGES.CONFIGURATION_FILE_STATICALLY_INVALID(error);
            return error;
        }
        return value;
    });
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { validateConfiguration };

