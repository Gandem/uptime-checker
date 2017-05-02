/**
 * @fileoverview Configuration utility index.
 * @module config
 * @author Nayef Ghattas
 */

/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

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
 * @param {boolean} verbose Flag to log in detail loading and validation error
 * @returns {(Object|Error)} Error if file unloadable or invalid, else configuration file
 */
function loadAndValidate(
    configurationFile,
    /* istanbul ignore next */
    // https://github.com/gotwarlost/istanbul/issues/779
    verbose = false
) {
    const configurationObject = loadConfigurationFile(configurationFile);

    if (configurationObject instanceof Error) {
        if (verbose === true) console.warn(configurationObject.message);
        return configurationObject;
    }

    const validConfigurationFile = validateConfiguration(configurationObject);

    if (validConfigurationFile instanceof Error) {
        if (verbose === true) {
            console.warn(
                ERROR_MESSAGES.CONFIGURATION_FILE_STATICALLY_INVALID(
                    configurationFile,
                    validConfigurationFile
                )
            );
        }
        return validConfigurationFile;
    }

    return validConfigurationFile;
}

/**
 * Cycle through configuration files, returns the highest-priority valid configurationObject
 * @param {Object} options
 * @param {boolean} options.warnOnPriority
 * @param {boolean} options.verbose
 * @return {Object} configurationObject
 * @throws {Error} If no configuration file is found, or is valid
 */
function getFirstValidConfiguration(
    options = {
        warnOnPriority: true,
        verbose: false,
    }
) {
    debug('Starting search for configuration files');

    let firstValidConfiguration;

    const configurationFiles = findConfigurationFiles();

    if (configurationFiles instanceof Error) {
        return handleErrorThenExit(configurationFiles.message);
    }

    // When a valid configuration Object is returned, the loop breaks
    // firstValidConfiguration would equal the configurationObject
    // When a false value is returned, the loop continues
    // If warnOnPriority is true :
    // Warns if a configuration file has priority but is invalid
    for (let i = 0; i < configurationFiles.length; i += 1) {
        const configurationFile = configurationFiles[i];

        const loadedAndValidatedConfigurationFile = loadAndValidate(
            configurationFile,
            options.verbose
        );

        if (loadedAndValidatedConfigurationFile instanceof Error) {
            if (options.warnOnPriority === true) {
                console.warn(ERROR_MESSAGES.HAS_PRIORITY_INVALID_CONFIG(configurationFile));
            }
        } else {
            // If a file has been ignored and warnOnPriority is enabled,
            // Or if verbose is true
            // Logs which configuration file is being used
            if ((options.warnOnPriority === true && i > 0) || options.verbose === true) {
                console.warn(`Using configuration file : ${configurationFiles}`);
            }
            firstValidConfiguration = loadedAndValidatedConfigurationFile;
            break;
        }
    }

    // If the loop ends and firstValidConfiguration is still undefined
    // Then no configuration file is valid
    if (firstValidConfiguration === undefined) {
        debug(`Found ${configurationFiles} but they're all invalid`);
        return handleErrorThenExit(
            ERROR_MESSAGES.ALL_CONFIGURATION_FILES_INVALID(configurationFiles)
        );
    }

    return firstValidConfiguration;
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { loadAndValidate, getFirstValidConfiguration };

