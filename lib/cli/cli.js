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
const { daemonStart, daemonStop, daemonStatus } = require('./cli-daemon.js');
const { dashboardStart } = require('./cli-dashboard.js');

// ------------------------------------------------------------------------------
// Cli help & usage
// ------------------------------------------------------------------------------

cli.usage('Usage: uptime-checker <command>... [--option-1 option-1-value --option-2]');

cli.help('h').alias('h', 'help');

// ------------------------------------------------------------------------------
// Cli options
// ------------------------------------------------------------------------------

cli.option('configuration-file', {
    alias: 'c',
    describe: 'Specify a configuration file',
    type: 'string',
});

// ------------------------------------------------------------------------------
// Cli commands
// ------------------------------------------------------------------------------

cli.command('config', 'All related configuration files utilities', cliConfig);

cli.command('start', 'start uptime-checker', daemonStart);

cli.command('stop', 'stop uptime-checker', daemonStop);

cli.command('status', 'status of uptime-checker', daemonStatus);

cli.command('dashboard', 'start the dashboard', dashboardStart);

// ------------------------------------------------------------------------------
// Execute command
// ------------------------------------------------------------------------------

cli.parse(process.argv);

