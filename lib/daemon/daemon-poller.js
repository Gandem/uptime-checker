/**
 * @fileoverview Daemon that keeps track of the pollers
 * @module daemon
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const Influx = require('influx');
const Promise = require('bluebird');
const { parse } = require('url');

const { Daemon } = require('./daemon.js');

const { IPC_DAEMON_ID, UPTIME_CHECKER_HOME } = require('../util/constants.js');
const { Poller } = require('../poller/poller.js');
const { dumpErrorFileThenExit } = require('../util/errors.js');

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
        this.availabilityChecker = {};
        this.setFlagOnFirstPoll = this.setFlagOnFirstPoll.bind(this);
        this.initializeAvailabilityCheck = this.initializeAvailabilityCheck.bind(this);
        this.initializePollers();
    }

    /**
       * Helper function to initialize pollers for each website
      */
    initializePollers() {
        this.configuration.website.forEach((website) => {
            this.pollers[parse(website.url).href] = new Poller(
                website,
                this.writePointToDatabase,
                this.setFlagOnFirstPoll
            );
        });
    }

    setFlagOnFirstPoll(host) {
        return this.initializeAvailabilityCheck(host);
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
                this.stopCheckingAvailability();
            });
        });

        this.IPC.server.start();
    }

    getMetric(host, metric, timeframe) {
        return this.database
            .query(`select * from ${metric} where host = ${Influx.escape.stringLit(host)} and time > now() - ${timeframe} order by time desc`);
    }

    getLastLoggedMetric(host, metric) {
        return this.database
            .query(`select last(*) from ${metric} where host = ${Influx.escape.stringLit(host)}`);
    }

    initializeAvailabilityCheck(host) {
        return this.getLastLoggedMetric(host, 'availability')
            .then((row) => {
                this.availabilityChecker[host] = {
                    intervalID: null,
                    alertState: (row[0] && row[0].percentage) < 80,
                };
            })
            .then(() => this.checkAvailabilityPoll(host));
    }

    calculateAvailability(host) {
        return Promise.all([
            this.getMetric(host, 'http_response_code', '2m'),
            this.getMetric(host, 'http_error', '2m'),
        ])
            .then(([responseCodes = [], errors = []]) => {
                if (responseCodes.length > 0 || errors.length > 0) {
                    const normalCodes = responseCodes.filter(
                        ({ code }) => code[0] !== '4' && code[0] !== '5'
                    );

                    return 100 * (normalCodes.length / (responseCodes.length + errors.length));
                }
                return Promise.reject(new Error(`No log found for ${host}`));
            })
            .catch(error => dumpErrorFileThenExit(error.message));
    }

    checkAvailabilityAndAlert(host) {
        this.calculateAvailability(host).then((availability) => {
            this.writePointToDatabase([
                {
                    measurement: 'availability',
                    tags: { host },
                    fields: {
                        percentage: availability,
                    },
                },
            ]);
            if (availability < 80) {
                this.availabilityChecker[host].alertState = true;
                this.writePointToDatabase([
                    {
                        measurement: 'alert',
                        tags: { host },
                        fields: {
                            error: `ALERT: Website ${host} is down. availability=${availability}, time=${new Date(Date.now()).toString()}`,
                        },
                    },
                ]);
            } else if (this.availabilityChecker[host].alertState === true) {
                this.availabilityChecker[host].alertState = false;
                this.writePointToDatabase([
                    {
                        measurement: 'alert',
                        tags: { host },
                        fields: {
                            error: `RECOVERED: Website ${host} is now up. availability=${availability}, time=${new Date(Date.now()).toString()}`,
                        },
                    },
                ]);
            }
        });
    }

    checkAvailabilityPoll(host) {
        this.availabilityChecker[host].intervalID = setInterval(
            () => this.checkAvailabilityAndAlert(host),
            2000
        );
    }

    stopCheckingAvailability() {
        Object.keys(this.availabilityChecker).forEach(key =>
            clearInterval(this.availabilityChecker[key].intervalID)
        );
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

