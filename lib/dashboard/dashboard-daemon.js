/* eslint no-console: 0 */

'use strict';

const chalk = require('chalk');

const { sendMessageToDaemon } = require('../daemon/daemon-messaging.js');
const { handleErrorThenExit } = require('../util/errors.js');

function getActivelyPolledHosts() {
    return sendMessageToDaemon('dashboard', { type: 'status' }).then(({ message }) => message);
}

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

module.exports = { getActivelyPolledHosts, checkIfDaemonIsUp };

