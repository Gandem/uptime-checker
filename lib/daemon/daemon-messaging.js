/**
 * @fileoverview Help function to send messages to the daemon
 * @module daemon/daemon-messaging
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const ipc = require('node-ipc');
const Promise = require('bluebird');

const { IPC_DAEMON_ID, UPTIME_CHECKER_HOME } = require('../util/constants.js');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Helper function to send easily a message to the daemon
 * @param {string} clientID The ID of the client
 * @param {Object} message The message that will be sent to the server
 * @param {string} message.type The type of the message
 * @param {Object} message.data The data inside the message
 * @param {Function} callback A callback for getting the error and the response
 * @return {void}
 */
function sendMessageToDaemonCallback(clientID, message, callback) {
    ipc.config.id = clientID;
    ipc.config.retry = 1500;
    ipc.config.silent = true;
    ipc.config.socketRoot = `${UPTIME_CHECKER_HOME}/`;

    ipc.connectTo(IPC_DAEMON_ID, () => {
        ipc.of[IPC_DAEMON_ID].on('connect', () => {
            ipc.of[IPC_DAEMON_ID].emit(message.type, message.data);
        });

        ipc.of[IPC_DAEMON_ID].on(message.type, (data) => {
            ipc.disconnect(IPC_DAEMON_ID);
            callback(null, data);
        });

        ipc.of[IPC_DAEMON_ID].on('error', (error) => {
            ipc.disconnect(IPC_DAEMON_ID);
            callback(error);
        });
    });
}

// Promisify the function with bluebird
const sendMessageToDaemon = Promise.promisify(sendMessageToDaemonCallback);

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { sendMessageToDaemon };

