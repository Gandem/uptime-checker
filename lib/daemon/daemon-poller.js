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
    /**
     * Daemon class constructor
     */
    constructor(props) {
        super(props);
        // The pollers are stored here
        this.pollers = {};
        // We store flags in this object for alerting recovery logic
        this.availabilityChecker = {};
        // To Start availability calculation after the first poll
        this.setFlagOnFirstPoll = this.setFlagOnFirstPoll.bind(this);
        this.initializeAvailabilityCheck = this.initializeAvailabilityCheck.bind(this);
        // Initilizing pollers for each website
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

    /**
     * A function to initilize availability check after the first poll to a website
     * @param {string} host The hostname url.parse().href designation
     */
    setFlagOnFirstPoll(host) {
        return this.initializeAvailabilityCheck(host);
    }

    /**
     * Start polling with each poller
     * Each poller correspons to a website
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
            // IPC server PING response
            this.IPC.server.on('ping', (data, socket) => {
                this.IPC.server.emit(socket, 'ping', {
                    message: 'pong',
                });
            });

            // IPC server STATUS response
            this.IPC.server.on('status', (data, socket) => {
                this.IPC.server.emit(socket, 'status', {
                    message: {
                        website: this.configuration.website,
                        database: this.configuration.database,
                    },
                });
            });

            // IPC server STOP response
            this.IPC.server.on('stop', (data, socket) => {
                this.IPC.server.emit(socket, 'stop', {
                    message: 'stopping',
                });
                this.stopPolling();
                this.IPC.server.stop();
                this.stopCheckingAvailability();
            });
        });

        // Starting IPC server
        this.IPC.server.start();
    }

    /**
     * A function to query the database for a specific metric and timeframe
     * @param {string} host The hostname url.parse().href designation
     * @param {string} metric The metric name in database
     * @param {string} timeframe The timeframe that conforms with influxDB query syntax
     */
    getMetric(host, metric, timeframe) {
        return this.database
            .query(`select * from ${metric} where host = ${Influx.escape.stringLit(host)} and time > now() - ${timeframe} order by time desc`);
    }

    /**
     * A function to get the very last entry for a specific metric in the database
     * @param {string} host The hostname url.parse().href designation
     * @param {string} metric The metric name in database
     */
    getLastLoggedMetric(host, metric) {
        return this.database
            .query(`select last(*) from ${metric} where host = ${Influx.escape.stringLit(host)}`);
    }

    /**
     * Start checking availability for the host
     * This function is started after the poller calls setFlagOnFirstPoll
     * @param {string} host The hostname url.parse().href designation
     */
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

    /**
     * Calculate the availability of the host from the corresponding entries in database
     * A webiste is supposed not available if:
     * <pre>
     * - There is a general Error (TCP socket hang up, timeout, adress not found)
     * - An http response with a status code starting with 4 or 5
     * </pre>
     * @param {string} host The hostname url.parse().href designation
     */
    calculateAvailability(host) {
        // Get HTTP errors (socket hangup / timeout) and response codes
        return (
            Promise.all([
                this.getMetric(host, 'http_response_code', '2m'),
                this.getMetric(host, 'http_error', '2m'),
            ])
                .then(([responseCodes = [], errors = []]) => {
                    if (responseCodes.length > 0 || errors.length > 0) {
                        // filter 1xx 2xx and 3xx responses
                        const normalCodes = responseCodes.filter(
                            ({ code }) => code[0] !== '4' && code[0] !== '5'
                        );
                        // Availability calculation
                        return 100 * (normalCodes.length / (responseCodes.length + errors.length));
                    }
                    // If there is an awkward error, reject
                    return Promise.reject(new Error(`No log found for ${host}`));
                })
                // Catch rejection, dump error in file and exit daemon
                .catch(error => dumpErrorFileThenExit(error.message))
        );
    }

    /**
     * Main alerting logic !
     * Triggers availability calculation and logs it in database
     * If availability < 80 trigger an alert
     * If availability > 80 check the flag this this.availabilityChecker
     * If the flag was in alert mode, log a recovery
     * Else do nothing :)
     * @param {string} host The hostname url.parse().href designation
     */
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

    /**
     * The interval function that is ran for availability checks
     * @TODO: make the interval custom with a configuration flag
     * @param {string} host The hostname url.parse().href designation
     */
    checkAvailabilityPoll(host) {
        this.availabilityChecker[host].intervalID = setInterval(
            () => this.checkAvailabilityAndAlert(host),
            2000
        );
    }

    /**
     * Stop all availability checking
     * Is called before the daemon exits
     */
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

// start polling and caculating alerting logic
daemon.startIPCServer();
daemon.startPolling();

