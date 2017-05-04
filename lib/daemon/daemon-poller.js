/**
 * @fileoverview Daemon that keeps track of the pollers
 * @module daemon
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const { Daemon } = require('./daemon.js');

const { IPC_DAEMON_ID, UPTIME_CHECKER_HOME } = require('../util/constants.js');
const { Poller } = require('../poller/poller.js');

// ------------------------------------------------------------------------------
// Class
// ------------------------------------------------------------------------------

/**
 * Class representing a running Daemon with pollers
 * @extends Daemon
 */
class DaemonPoller extends Daemon {
    constructor(props) {
        super(props);
        this.pollers = {};

        this.initializePollers();
    }

    /**
       * Helper function to initialize pollers for each website
      */
    initializePollers() {
        this.configuration.website.forEach((website) => {
            this.pollers[website.url] = new Poller(website, this.writePointToDatabase);
        });
    }

    /**
     * Start polling with each poller
    */
    startPolling() {
        Object.keys(this.pollers).forEach(key => this.pollers[key].poll());
    }

    /**
     * Stop polling with each poller
    */
    stopPolling() {
        Object.keys(this.pollers).forEach(key => this.pollers[key].stopPolling());
    }

    /**
     * Start the IPC server, and IPC server API
    */
    startIPCServer() {
        this.IPC.serve(() => {
            this.IPC.server.on('ping', (data, socket) => {
                this.IPC.server.emit(socket, 'ping', {
                    message: 'pong',
                });
            });

            this.IPC.server.on('status', (data, socket) => {
                this.IPC.server.emit(socket, 'status', {
                    message: {
                        website: this.configuration.website,
                        database: this.configuration.database,
                    },
                });
            });

            this.IPC.server.on('stop', (data, socket) => {
                this.IPC.server.emit(socket, 'stop', {
                    message: 'stopping',
                });
                this.stopPolling();
                this.IPC.server.stop();
            });
        });

        this.IPC.server.start();
    }
}

// ------------------------------------------------------------------------------
// Create and run the daemon
// ------------------------------------------------------------------------------

// create the daemon poller
const daemon = new DaemonPoller({
    configurationFile: process.argv[2],
    IPCID: IPC_DAEMON_ID,
    IPCSocketRoot: `${UPTIME_CHECKER_HOME}/`,
});

// start polling
daemon.startIPCServer();
daemon.startPolling();

