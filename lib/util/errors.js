/**
 * @fileoverview Helper for handling errors.
 * @module util/errors
 * @author Nayef Ghattas
 */

/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const { IPC_DAEMON_ID, UPTIME_CHECKER_HOME } = require('./constants.js');

// ------------------------------------------------------------------------------
// Exported Functions
// ------------------------------------------------------------------------------

/**
 * Helper for logging a string, and then quitting the application
 * @param {string} reason The error message that is logged
 * @returns {void} Exists the application
 */
function handleErrorThenExit(reason) {
    console.error(reason);
    process.exit(1);
}

/**
 * When the daemon hangs up because of an error, dump the error message
 * to a file, in the UPTIME_CHECKER_HOME
 * @param {string} reason The string to log in the logfile
 * @return {void}
 */
function dumpErrorFileThenExit(reason) {
    fs.writeFileSync(`uptime_checker_error_${Date.now()}.log`, reason);
    fs.unlinkSync(`${UPTIME_CHECKER_HOME}/app.${IPC_DAEMON_ID}`);
    process.exit(1);
}

// ------------------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------------------

/**
 * Helper for prettifying JSON errors
 * @param {Error} Error
 * @return {string} Prettified version of the error
 */
function prettifyJSONErrors({ message }) {
    return chalk.bold(message.split('\n')[0]);
}

/**
 * Helper for prettifying joi errors
 * @param {Error} Error
 * @return {string} Prettified version of the error
 */
function prettifyJOIErrors(error) {
    const readableErrorMessage = error.details[0].message;
    if (readableErrorMessage.indexOf('pattern') !== -1) {
        return readableErrorMessage.split(':')[0];
    }
    return readableErrorMessage;
}

// ------------------------------------------------------------------------------
// Error messages definitions
// ------------------------------------------------------------------------------

/**
 * @constant
 * @type {Object}
 * @description The application error messages
 */
const ERROR_MESSAGES = {
    /**
   * @function
   * @param {string} filePath The file path of the incorrect JSON
   * @param {Error} error The error returned when parsing the JSON
   * @return {string} The custom error message
   */
    CONFIGURATION_FILE_INCORRECT_JSON(filePath, error) {
        return `${chalk.underline(`In ${filePath}:`)}\n\n${chalk.bold.yellow('Configuration parsing error: \n\n')}${prettifyJSONErrors(error)}\n`;
    },
    /**
   * @function
   * @param {string} filePath The file path of the invalid configuration
   * @param {Error} error The error returned when parsing the JSON
   * @return {string} The custom error message
   */
    CONFIGURATION_FILE_STATICALLY_INVALID(filePath, error) {
        return `${chalk.underline(`In ${filePath}:`)}\n\n${error.message}`;
    },
    /**
   * @function
   * @return {string} The custom error message for no configuration file found
   */
    NO_CONFIGURATION_FILE_FOUND() {
        return chalk.red(
            'Could not find the uptime-checker configuration file \n' +
                'Be sure to include uptime-checker.json or .uptime-checker.json in : \n' +
                ` ${chalk.bold('* -')} The uptime-checker project directory : ${path.resolve(`${__dirname}/../../`)} \n` +
                ` ${chalk.bold('* -')} The user's home directory \n` +
                ` ${chalk.bold('* -')} ${chalk.dim('(Only on a Linux-based Operating System)')} In /etc/uptime-checker/`
        );
    },
    /**
   * @function
   * @param {Error} error The error returned by joi
   * @return {string} The custom error message
   */
    CONFIGURATION_OBJECT_STATICALLY_INVALID(error) {
        return `${chalk.bold.yellow('Configuration validation error: \n\n') + prettifyJOIErrors(error)}\n`;
    },
    /**
   * @function
   * @param {string} filePath The file path of the invalid configuration
   * @return {string} The custom error message
   */
    HAS_PRIORITY_INVALID_CONFIG(filePath) {
        return (
            chalk.yellow(`WARNING: ${filePath} has priority but is an invalid JSON / configuration file \n`) +
            chalk.bold(`Please run ${chalk.dim('uptime-checker config check')} for more information`)
        );
    },
    /**
   * @function
   * @param {Array} configurationFiles Array with the pathes of invalid configuration files
   * @return {string} The custom error message
   */
    ALL_CONFIGURATION_FILES_INVALID(configurationFiles) {
        if (configurationFiles.length === 1) {
            return chalk.bold
                .red(`ERROR: The only configuration file found : ${configurationFiles} is invalid `);
        }
        return chalk.bold
            .red(`ERROR: All found configuration files : ${configurationFiles} are invalid `);
    },
};

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { handleErrorThenExit, dumpErrorFileThenExit, ERROR_MESSAGES };

