/**
 * @fileoverview Utility wrapper to poll a domain, using HTTPs
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const https = require('https');
const Promise = require('bluebird');

const debug = require('debug')('uptime-checker:poller-https');

// ------------------------------------------------------------------------------
// Promisify
// ------------------------------------------------------------------------------

/**
 * @function httpsRequest
 * @description Wrapper around https.request to promisify manually, as it doesn't string
 * follow NodeJS callback conventions
 * @param {Object} options HTTPS request options, same as http.request native node module
 * @param {boolean} [options.ignoreBody] custom options, to kill socket before receiving body
 * @returns {Promise<HTTPIncomingMessage|Error>} Promise to an HTTPS Incoming Message
*/
const httpsRequest = Promise.method(
    options =>
        new Promise((resolve, reject) => {
            const startDate = Date.now();
            const request = https.request(options, (response) => {
                const endDate = Date.now();
                debug(`Response headers received from ${options.host || options.hostname}`);

                // Bundle the result
                const result = {
                    httpVersion: response.httpVersion,
                    httpStatusCode: response.statusCode,
                    headers: response.headers,
                    body: '',
                    trailers: response.trailers,
                    TTFB: endDate - startDate,
                };
                // Build the body
                response.on('data', (chunk) => {
                    result.body += chunk;
                });
                // resolve the response, once the body is complete
                response.on('end', () => {
                    result.responseTime = Date.now() - startDate;
                    debug(`Response received: ${JSON.stringify(result)}`);
                    resolve(result);
                });
            });

            // Handle errors
            request.on('error', (error) => {
                reject(error);
            });

            // Must always call .end() even if there is no data being written to the request body
            request.end();
        })
);

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { httpsRequest };

