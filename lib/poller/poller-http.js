/**
 * @fileoverview Utility wrapper to poll a domain, using HTTP
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
 * @param {boolean} [options.ignoreBody] custom options, to kill socket before receiving body
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
                    responseTime: endDate - startDate,
                };

                if (options.ignoreBody === true) {
                    // We don't need to check the body we resolve the response
                    debug('Ignoring body as specified to the request function');
                    response.destroy();
                    resolve(result);
                } else {
                    // Build the body
                    response.on('data', (chunk) => {
                        result.body += chunk;
                    });
                    // resolve the response, once the body is complete
                    response.on('end', () => {
                        result.responseTime = Date.now() - startDate;
                        resolve(result);
                    });
                }
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

