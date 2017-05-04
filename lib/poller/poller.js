/**
 * @fileoverview Daemon that runs the website pollers
 * @module daemon
 * @author Nayef Ghattas
 */

/* eslint global-require: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const { parse } = require('url');

const { dnsPoll } = require('./poller-dns.js');

// ------------------------------------------------------------------------------
// Class
// ------------------------------------------------------------------------------

/**
 * Class representing a Poller for a specific website
 */
class Poller {
    /**
   * Create a Poller
   * @param {Object} configurationObject poller configuration object
   * @param {Function} writeToDatabase A function to write to Database the result of the checks
   */
    constructor({ url, checkInterval, httpOptions = {} }, writeToDatabase) {
        this.url = parse(url);
        this.checkInterval = checkInterval || 2000;
        this.httpOptions = Object.assign(httpOptions, { hostname: this.url.hostname });
        this.intervalID = null;
        this.writeToDatabase = writeToDatabase;
        this.tags = { host: this.url.href };

        this.webPoller = this.url.protocol.indexOf('https') !== -1
            ? require('./poller-https.js').httpsRequest
            : require('./poller-http.js').httpRequest;
    }

    /**
   * Send a single Poll to a website
   */
    singlePoll() {
        this.webPoller(this.httpOptions)
            .then(data =>
                this.writeToDatabase([
                    {
                        measurement: 'http_response_time',
                        tags: this.tags,
                        fields: { duration: data.responseTime },
                    },
                    {
                        measurement: 'http_response_code',
                        tags: this.tags,
                        fields: { code: data.httpStatusCode },
                    },
                    {
                        measurement: 'http_ttfb',
                        tags: this.tags,
                        fields: { duration: data.TTFB },
                    },
                ])
            )
            .catch(error =>
                this.writeToDatabase([
                    {
                        measurement: 'http_error',
                        tags: this.tags,
                        fields: { error: error.message },
                    },
                ])
            );

        dnsPoll(this.url.hostname)
            .then(data =>
                this.writeToDatabase([
                    {
                        measurement: 'dns_ip',
                        tags: this.tags,
                        fields: { ip: data.address },
                    },
                    {
                        measurement: 'dns_response_time',
                        tags: this.tags,
                        fields: { duration: data.responseTime },
                    },
                ])
            )
            .catch(error =>
                this.writeToDatabase([
                    { measurement: 'dns_error', tags: this.tags, fields: { error: error.message } },
                ])
            );
    }
    /**
   * Poll with defined interval
   */
    poll() {
        this.intervalID = setInterval(() => this.singlePoll(), this.checkInterval);
    }

    /**
   * Stop polling
   */
    stopPolling() {
        clearInterval(this.intervalID);
    }
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { Poller };

