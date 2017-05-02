/**
 * @fileoverview CLI configuration check.
 * @module cli/config
 * @author Nayef Ghattas
 */

/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const chalk = require('chalk');

const debug = require('debug')('uptime-checker:cli');

const { loadAndValidate, getFirstValidConfiguration } = require('../config/config.js');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Checks the configuration file
 * @param {Object} yargs Instance of the yargs module
 * @returns {void}
 */
function cliConfig(yargs) {
    return yargs.command(
        'check',
        'Checks configuration file',
        () => {},
        (argv) => {
            debug('Checking whether a configuration file is passed');
            if (argv.configurationFile) {
                debug('Loading expected configuration file');
                loadAndValidate(argv.configurationFile, true);
                console.log(
                    argv.configurationFile + chalk.green.bold(' is a valid configuration file.')
                );
            } else {
                debug('Searching for a valid configuration file');
                getFirstValidConfiguration({
                    verbose: true,
                    warnOnPriority: false,
                });
                console.log(chalk.green.bold('Everything is in order !'));
            }
        }
    );
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { cliConfig };

