/**
 * @fileoverview Functions to start / stop / get the status of the daemon from the cli
 * @module cli/daemon
 * @author Nayef Ghattas
 */

/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const childProcess = require('child_process');
const chalk = require('chalk');
const fs = require('fs');

const debug = require('debug')('uptime-checker:cli');

const { sendMessageToDaemon } = require('../daemon/daemon-messaging.js');
const { UPTIME_CHECKER_HOME, IPC_DAEMON_ID } = require('../util/constants.js');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Function to start the daemon if it's not already running
 * @param {Object} argv Yargs argv argv
 * @see https://github.com/yargs/yargs
 * @return {void}
 */
function daemonStart({ argv } = {}) {
    debug("Trying to ping the daemon to see if it's started");

    sendMessageToDaemon('cli', { type: 'ping' })
        // If the daemon respond, then the daemon is already running
        .then(() => {
            debug('The daemon is already running');
            console.log(chalk.yellow.bold('[START] Uptime-checker is already running...'));
        })
        // Else, start the daemon
        .catch(() => {
            debug('The daemon is not running, starting the daemon');
            const configurationFile = argv && argv.configurationFile
                ? `${process.cwd()}/${argv.configurationFile}`
                : '';

            // see https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
            const daemon = childProcess.spawn(
                'node',
                [`${UPTIME_CHECKER_HOME}/lib/daemon/daemon-poller.js`, configurationFile],
                {
                    detached: true,
                    stdio: 'inherit',
                }
            );

            // unreference the daemon from it's parent (the cli process)
            // when it exists on a error
            daemon.on('close', () => {
                debug('The daemon just crashed');
                daemon.unref();
                fs.unwatchFile(`${UPTIME_CHECKER_HOME}/app.${IPC_DAEMON_ID}`);
            });

            // Wait for the daemon to start
            // @TODO: this only works on unix, should find a workaround on windows
            fs.watchFile(
                `${UPTIME_CHECKER_HOME}/app.${IPC_DAEMON_ID}`,
                { interval: 300 },
                (filename) => {
                    if (filename.dev !== 0) {
                        debug('The daemon is now running');
                        daemon.unref();
                        fs.unwatchFile(`${UPTIME_CHECKER_HOME}/app.${IPC_DAEMON_ID}`);
                    }
                }
            );

            console.log(chalk.bold('[START] Uptime-checker is starting'));
        });
}

/**
 * Ask the running daemon to stop
 * @return {void}
*/
function daemonStop() {
    sendMessageToDaemon('cli', { type: 'stop' })
        .then(() => console.log(chalk.bold('[STOP] Uptime-checker is now stopped')))
        .catch(() => {
            console.log(chalk.red('[STOP] Uptime-checker is already stopped'));
        });
}

/**
 * Get the status of the runnning daemon
 * @return {void}
 */
function daemonStatus() {
    sendMessageToDaemon('cli', { type: 'status' })
        .then(
            /* istanbul ignore next */
            // https://github.com/gotwarlost/istanbul/issues/779
            ({ message } = {}) => {
                const websites = message.website.reduce((string, { url }, index) => {
                    const spacing = index === message.website.length - 1 ? '' : '\n';
                    return `${string}${chalk.bold.green('* ') + url}${spacing}`;
                }, '');
                console.log(`${chalk.bold('[STATUS] Uptime-checker is running \n')}The following websites are being polled : \n${websites}`);
            }
        )
        .catch(() => {
            console.log(chalk.red('[STATUS] Uptime-checker is not running'));
        });
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { daemonStart, daemonStop, daemonStatus };

