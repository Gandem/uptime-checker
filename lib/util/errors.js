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
    if (readableErrorMessage.indexOf('pattern') > -1) {
        return readableErrorMessage.split(':')[0];
    }
    return readableErrorMessage;
}

// ------------------------------------------------------------------------------
// Error messages definitions
// ------------------------------------------------------------------------------

const ERROR_MESSAGES = {
    CONFIGURATION_FILE_INCORRECT_JSON(filePath, error) {
        return `Unable to parse the ${chalk.bold('JSON configuration file')} in ${filePath} \n\n ${prettifyJSONErrors(error)}`;
    },
    NO_CONFIGURATION_FILE_FOUND() {
        return chalk.red(
            'Could not find any uptime-checker configuration file \n' +
                'Be sure to check in : \n' +
                ` ${chalk.bold('* -')} The uptime-checker project directory \n` +
                ` ${chalk.bold('* -')} The user's home directory \n` +
                ` ${chalk.bold('* -')} ${chalk.dim('(Only on a Linux-based Operating System)')} In /etc/uptime-checker/`
        );
    },
    CONFIGURATION_FILE_STATICALLY_INVALID(error) {
        return chalk.bold.yellow('Configuration validation error: ') + prettifyJOIErrors(error);
    },
};

module.exports = { handleErrorThenExit, ERROR_MESSAGES };

