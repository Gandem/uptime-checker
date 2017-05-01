/**
 * @fileoverview Configuration utility index.
 * @author Nayef Ghattas
 */

/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const chalk = require('chalk');

const debug = require('debug')('uptime-checker:config');

const { findConfigurationFiles, loadConfigurationFile } = require('./config-file.js');
const { validateConfiguration } = require('./config-validator.js');
const { handleErrorThenExit, ERROR_MESSAGES } = require('../util/errors.js');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Checks if a configuration file path lead to a loadable, and statically valid configuration
 * @param {string} configurationFile The configuration file path
 * @param {boolean} verbose Boolean flag for verbosity
 * @returns {(boolean|Object)} false if file unloadable or invalid, else configuration file
 */
function loadAndValidate(configurationFile, verbose = false) {
    const configurationObject = loadConfigurationFile(configurationFile);

    if (configurationObject instanceof Error) {
        console.warn(ERROR_MESSAGES.HAS_PRIORITY_UNPARSABLE_JSON(configurationFile));
        if (verbose === true) console.log(configurationObject.message);
        return false;
    }

    const validConfigurationFile = validateConfiguration(configurationObject);

    if (validConfigurationFile instanceof Error) {
        console.warn(ERROR_MESSAGES.HAS_PRIORITY_INVALID_CONFIG(configurationFile));
        if (verbose === true) console.log(validConfigurationFile.message);
        return false;
    }

    return validConfigurationFile;
}

/**
 * Cycle through configuration files, returns the highest-priority valid configurationObject
 * @return {Object} configurationObject
 * @throws {Error} If no configuration file is found, or is valid
 */
function getFirstValidConfiguration(verbose = false) {
    debug('Starting search for configuration files');

    let firstValidConfiguration;

    const configurationFiles = findConfigurationFiles();

    if (configurationFiles instanceof Error) {
        return handleErrorThenExit(configurationFiles.message);
    }

    // When a truthy value is returned, the loop breaks
    // firstValidConfiguration would equal the configurationObject
    // When a falsy value is returned, the loop continues
    configurationFiles.some((configurationFile) => {
        firstValidConfiguration = loadAndValidate(configurationFile);
        if (firstValidConfiguration && verbose === true) console.log(`Using ${configurationFile}`);
        return firstValidConfiguration;
    });

    // If the loop ends on false, it means no configuration file is valid
    if (firstValidConfiguration === false) {
        debug(`Found ${configurationFiles} but they're all invalid`);
        return handleErrorThenExit(chalk.red('ERROR: All found configurationFiles are invalid !'));
    }
    return firstValidConfiguration;
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { getFirstValidConfiguration };

