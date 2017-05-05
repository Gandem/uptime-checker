'use strict';

const Influx = require('influx');
const { parse } = require('url');
const Promise = require('bluebird');

const { max, min, mean } = require('../util/array.js');
const { createInfluxDatabase } = require('../database/database.js');

class DatabaseConnector {
    constructor(configuration) {
        this.database = createInfluxDatabase(configuration.database);

        this.lastAlertCheck = {};
        configuration.website.forEach(({ url }) => {
            this.lastAlertCheck[parse(url).href] = Date.now();
        });
    }

    getRecentLogs(host) {
        const hostName = parse(host).href;

        return [
            this.getMetric(hostName, 'http_response_time', '10m')
                .then(row => row.map(({ duration }) => duration))
                .then((duration) => {
                    if (duration.length === 0) {
                        return Promise.reject('No HTTP Response data available');
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
                        max: maxHTTPrt,
                        min: minHTTPrt,
                        mean: meanHTTPrt,
                    }) => `HTTP response time (MIN/AVG/MAX) in ms: ${minHTTPrt}/${meanHTTPrt}/${maxHTTPrt}`
                )
                .catch(err => err),
            this.getMetric(hostName, 'http_ttfb', '10m')
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

            this.getMetric(hostName, 'availability', '10m')
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

            this.getMetric(hostName, 'http_response_code', '10m')
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

    getMetric(host, metric, timeframe) {
        return this.database
            .query(`select * from ${metric} where host = ${Influx.escape.stringLit(host)} and time > now() - ${timeframe} order by time desc`);
    }

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

module.exports = { DatabaseConnector };

