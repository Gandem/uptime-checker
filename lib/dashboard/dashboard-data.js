/**
 * @fileoverview Main dashboard database connection logic
 * @module dashboard/data
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const Influx = require('influx');
const { parse } = require('url');
const Promise = require('bluebird');

const { max, min, mean } = require('../util/array.js');
const { createInfluxDatabase } = require('../database/database.js');

// ------------------------------------------------------------------------------
// Class
// ------------------------------------------------------------------------------

/**
 * Class representing a connection with the database
 * @extends Daemon
 */
class DatabaseConnector {
    /**
   * Constructor for the database connection
   * @param {object} database configuration object
   */
    constructor(configuration) {
        this.database = createInfluxDatabase(configuration.database);

        // Here, we store the date of the last time an alert check was made
        this.lastAlertCheck = {};
        configuration.website.forEach(({ url }) => {
            this.lastAlertCheck[parse(url).href] = Date.now();
        });
    }

    /**
   * Aggregate logs for availability / ttfb / response time and HTTP status codes
   * @param {string} host The hostname url.parse().href designation
   * @param {string} timeframe The timeframe as need for influxDB queries
   */
    getLogs(host, timeframe) {
        const hostName = parse(host).href;

        return [
            this.getMetric(hostName, 'http_response_time', timeframe)
                .then(row => row.map(({ duration }) => duration))
                .then((duration) => {
                    if (duration.length === 0) {
                        return Promise.reject('No HTTP Response data available');
                    }
                    return duration;
                })
                .then(duration => ({
                    // Round the results for better visibility
                    max: Math.round(max(duration) * 100) / 100,
                    min: Math.round(min(duration) * 100) / 100,
                    mean: Math.round(mean(duration) * 100) / 100,
                }))
                .then(
                    ({
                        max: maxHTTPrt,
                        min: minHTTPrt,
                        mean: meanHTTPrt,
                    }) => `HTTP response time (MIN/AVG/MAX) in ms: ${minHTTPrt}/${meanHTTPrt}/${maxHTTPrt}`
                )
                .catch(err => err),
            this.getMetric(hostName, 'http_ttfb', timeframe)
                .then(row => row.map(({ duration }) => duration))
                .then((duration) => {
                    if (duration.length === 0) {
                        return Promise.reject('No HTTP TTFB data available');
                    }
                    return duration;
                })
                .then(duration => ({
                    max: Math.round(max(duration) * 100) / 100,
                    min: Math.round(min(duration) * 100) / 100,
                    mean: Math.round(mean(duration) * 100) / 100,
                }))
                .then(
                    ({
                        max: maxHTTPttfb,
                        min: minHTTPttfb,
                        mean: meanHTTPttfb,
                    }) => `HTTP Time To First Byte (MIN/AVG/MAX) in ms: ${minHTTPttfb}/${meanHTTPttfb}/${maxHTTPttfb}`
                )
                .catch(err => err),

            this.getMetric(hostName, 'availability', timeframe)
                .then(row => row.map(({ percentage }) => percentage))
                .then(percentage => ({
                    max: Math.round(max(percentage) * 100) / 100,
                    min: Math.round(min(percentage) * 100) / 100,
                    last: Math.round(percentage[0] * 100) / 100,
                }))
                .then(
                    ({
                        max: maxAvail,
                        min: minAvail,
                        last: lastAvail,
                    }) => `Availability last 10minutes (MIN/LAST/MAX) in %: ${minAvail}/${lastAvail}/${maxAvail}`
                ),

            this.getMetric(hostName, 'http_response_code', timeframe)
                .then(row => row.map(({ code }) => code))
                .then((code) => {
                    if (code.length === 0) {
                        return Promise.reject('No HTTP response code data available');
                    }
                    return code;
                })
                .then(code =>
                    code.reduce((prev, curr) => {
                        prev[curr] = prev[curr] === undefined ? 1 : prev[curr] + 1;
                        return prev;
                    }, {})
                )
                .then(
                    codeAggregate => `Response code counts : ${Object.keys(codeAggregate).reduce((string, codeValue) => (string = `${codeValue} : ${codeAggregate[codeValue]}\n${string}`), '')}`
                )
                .catch(err => err),
        ];
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
     * A function to get all the alerts from a specific host
     * @param {string} host The hostname url.parse().href designation
     */
    getAlerts(host) {
        const hostName = parse(host).href;

        return this.database
            .query(
                `select * from alert where host = ${Influx.escape.stringLit(hostName)} order by time desc`
            )
            .then((errors) => {
                this.lastAlertCheck[hostName] = Date.now();
                return errors.map(({ error }) => error);
            });
    }

    /**
     * A function to get the latest alerts from a host
     * (Those that where inserted in the database after the latest checker)
     * @param {string} host The hostname url.parse().href designation
     */
    getLatestAlerts(host) {
        const hostName = parse(host).href;

        return this.database
            .query(
                `select * from alert where host = ${Influx.escape.stringLit(hostName)} and time > ${this.lastAlertCheck[hostName]}ms `
            )
            .then((errors) => {
                this.lastAlertCheck[hostName] = Date.now();
                return errors.map(({ error }) => error);
            });
    }
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { DatabaseConnector };

