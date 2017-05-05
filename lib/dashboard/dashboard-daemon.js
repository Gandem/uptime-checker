/**
 * @fileoverview Dashboard / daemon connection logic
 * @module dashboard/daemon
 * @author Nayef Ghattas
 */

/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const chalk = require('chalk');

const { sendMessageToDaemon } = require('../daemon/daemon-messaging.js');
const { handleErrorThenExit } = require('../util/errors.js');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Get from the daemon the list of polled hostnames and the database configuration
 * @return {void}
 */
function getActivelyPolledHosts() {
    return sendMessageToDaemon('dashboard', { type: 'status' }).then(({ message }) => message);
}

/**
 * Pings the daemon to try checking if the daemon is up
 * @return {void}
 */
function checkIfDaemonIsUp() {
    return sendMessageToDaemon('dashboard', { type: 'ping' })
        .then(({ message }) => message)
        .catch(() =>
            console.log(
                handleErrorThenExit(
                    chalk.red('Cannot connect to daemon, are you sure it is up and running ?')
                )
            )
        );
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { getActivelyPolledHosts, checkIfDaemonIsUp };

