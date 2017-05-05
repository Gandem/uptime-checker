/**
 * @fileoverview Utility wrapper to poll a domain, using HTTP
 * @module poller/http
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const http = require('http');
const Promise = require('bluebird');

const debug = require('debug')('uptime-checker:poller-http');

// ------------------------------------------------------------------------------
// Promisify
// ------------------------------------------------------------------------------

/**
 * @typedef {Object} HTTPIncomingMessage
 * @property {string} httpVersion The HTTP Version
 * @property {string} httpStatusCode The HTTP StatusCode
 * @property {Object} headers Incoming message headers
 * @property {Object} trailers Incoming message trailers
 * @property {string} [body] The body of the HTTP Message
 * @property {number} responseTime The response time in ms
 */

/**
 * @function httpRequest
 * @description Wrapper around http.request to promisify manually, as it doesn't string
 * follow NodeJS callback conventions
 * @param {Object} options HTTP request options, same as http.request native node module
 * @returns {Promise<HTTPIncomingMessage|Error>} Promise to an HTTP Incoming Message
*/
const httpRequest = Promise.method(
    options =>
        new Promise((resolve, reject) => {
            const startDate = Date.now();
            const request = http.request(options, (response) => {
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

module.exports = { httpRequest };

