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
const chalk = require('chalk');

const debug = require('debug')('uptime-checker:config');

// ------------------------------------------------------------------------------
// Configuration Schema
// ------------------------------------------------------------------------------

const websiteConfigurationSchema = joi.object
    .keys({
        hostname: joi.string().hostname(),
        port: joi.number().min(1).max(65535),
        check_interval: joi.number(),
    })
    .optionalKeys('check_interval', 'port');

const generalConfigurationSchema = joi.object
    .keys({
        website: joi.array().items(websiteConfigurationSchema).single(),
        check_interval: joi.number(),
    })
    .optionalKeys('check_interval');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * @param {Object} configurationObject Object representation of the configuration file
 * @return {boolean} true if configurationObject is valid
 * @throw {Error} if configurationObject is not valid
 */
function validateConfiguration(configurationObject) {
    debug('Validating configuration');

    joi.validate(configurationObject, generalConfigurationSchema, (err) => {
        if (err) {
            debug(`Configuration is ${chalk.red('invalid')} \n ${err.message}`);
            throw err;
        }
        return true;
    });
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { validateConfiguration };

