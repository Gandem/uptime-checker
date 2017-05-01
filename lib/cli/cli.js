#!/usr/bin/env node

/**
 * @fileoverview Uptime-checker cli
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const cli = require('yargs');

const { loadAndValidate, getFirstValidConfiguration } = require('../config/config.js');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

cli.usage('Usage: uptime-checker <command>... [--option-1 option-1-value --option-2]');

cli.option('configuration-file', {
    alias: 'c',
    describe: 'Specify a configuration file',
    type: 'string',
});

cli.command('config', 'All related configuration files utilities', yargs =>
    yargs.command(
        'check',
        'Checks configuration file',
        () => {},
        (argv) => {
            if (argv.configurationFile) {
                return loadAndValidate(argv.configurationFile, true);
            }
            return getFirstValidConfiguration({ verbose: true, warnOnPriority: false });
        }
    )
);

cli.help('h').alias('h', 'help');

// ------------------------------------------------------------------------------
// Execute command
// ------------------------------------------------------------------------------

cli.parse(process.argv);

