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

const { cliConfig } = require('./cli-config.js');
const { daemonStart } = require('./cli-daemon.js');

// ------------------------------------------------------------------------------
// Cli help & usage
// ------------------------------------------------------------------------------

cli.usage('Usage: uptime-checker <command>... [--option-1 option-1-value --option-2]');

cli.help('h').alias('h', 'help');

// ------------------------------------------------------------------------------
// Cli commands
// ------------------------------------------------------------------------------

cli.command('config', 'All related configuration files utilities', cliConfig);

cli.command('start', 'start uptime-checker', daemonStart);

// ------------------------------------------------------------------------------
// Cli options
// ------------------------------------------------------------------------------

cli.option('configuration-file', {
    alias: 'c',
    describe: 'Specify a configuration file',
    type: 'string',
});

// ------------------------------------------------------------------------------
// Execute command
// ------------------------------------------------------------------------------

cli.parse(process.argv);

