/**
 * @fileoverview Helper for constants throughout application
 * @module util/constants
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const path = require('path');
const os = require('os');

// ------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------

/**
 * @constant
 * @type {string}
 * @description The project home directory
 */
const UPTIME_CHECKER_HOME = path.resolve(`${__dirname}/../../`);

/**
 * @constant
 * @type {string}
 * @description The user's home directory
 */
const USER_HOME = os.homedir();

/**
 * @constant
 * @type {string}
 * @description The platform for which NodeJS has been compiled
 */
const OPERATING_SYSTEM = os.platform();

/**
 * @constant
 * @type {string}
 * @description The ID of the daemon for IPC communications
 */
const IPC_DAEMON_ID = 'uptime-checker-daemon';

// ------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------

module.exports = {
    UPTIME_CHECKER_HOME,
    USER_HOME,
    OPERATING_SYSTEM,
    IPC_DAEMON_ID,
};

