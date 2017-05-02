/**
 * @fileoverview Helper for handling errors.
 * @author Nayef Ghattas
 */

/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const chalk = require('chalk');
const path = require('path');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * @param {string} reason The error message that is logged
 * @returns {undefined} Exists the program
 */
function handleErrorThenExit(reason) {
    console.error(reason);
    process.exit(1);
}

function prettifyJSONErrors({ message }) {
    return chalk.bold(message.split('\n')[0]);
}

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

const ERROR_MESSAGES = {
    CONFIGURATION_FILE_INCORRECT_JSON(filePath, error) {
        return `${chalk.underline(`In ${filePath}:`)}\n\n${chalk.bold.yellow('Configuration parsing error: \n\n')}${prettifyJSONErrors(error)}\n`;
    },
    CONFIGURATION_FILE_STATICALLY_INVALID(filePath, error) {
        return `${chalk.underline(`In ${filePath}:`)}\n\n${error.message}`;
    },
    NO_CONFIGURATION_FILE_FOUND() {
        return chalk.red(
            'Could not find the uptime-checker configuration file \n' +
                'Be sure to include uptime-checker.json or .uptime-checker.json in : \n' +
                ` ${chalk.bold('* -')} The uptime-checker project directory : ${path.resolve(`${__dirname}/../../`)} \n` +
                ` ${chalk.bold('* -')} The user's home directory \n` +
                ` ${chalk.bold('* -')} ${chalk.dim('(Only on a Linux-based Operating System)')} In /etc/uptime-checker/`
        );
    },
    CONFIGURATION_OBJECT_STATICALLY_INVALID(error) {
        return `${chalk.bold.yellow('Configuration validation error: \n\n') + prettifyJOIErrors(error)}\n`;
    },
    HAS_PRIORITY_INVALID_CONFIG(filePath) {
        return (
            chalk.yellow(
                `WARNING: ${filePath} has priority but is an invalid JSON / configuration file \n`
            ) +
            chalk.bold(
                `Please run ${chalk.dim('uptime-checker config check')} for more information`
            )
        );
    },
    ALL_CONFIGURATION_FILES_INVALID(configurationFiles) {
        if (configurationFiles.length === 1) {
            return chalk.bold.red(
                `ERROR: The only configuration file found : ${configurationFiles} is invalid `
            );
        }
        return chalk.bold.red(
            `ERROR: All found configuration files : ${configurationFiles} are invalid `
        );
    },
};

module.exports = { handleErrorThenExit, ERROR_MESSAGES };

