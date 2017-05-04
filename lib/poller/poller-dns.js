/**
 * @fileoverview Utility wrapper to poll a domain, using DNS
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const dns = require('dns');
const Promise = require('bluebird');

const debug = require('debug')('uptime-checker:poller-dns');

// ------------------------------------------------------------------------------
// Promisify API
// ------------------------------------------------------------------------------

const dnsResolve = Promise.promisify(dns.resolve);

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Wrapper around dns.resolve for debugging purposes
 * @param {string} hostname The hostname to be polled
 * @returns {Promise<string|Error>} Promise to an IPv4 or IPv6 address
 */
function dnsPoll(hostname) {
    debug(`Trying to resolve ${hostname} with DNS`);

    let endDate;
    const startDate = Date.now();
    return dnsResolve(hostname)
        .then((address) => {
            endDate = Date.now();
            // If the DNS Query answered with an Empty response, try IPv6
            if (address.length === 0) return dnsResolve(hostname, 'AAAA');
            return {
                address: address[0],
                responseTime: endDate - startDate,
            };
        })
        .then((address) => {
            const ipv6endDate = Date.now();
            let result;
            if (Array.isArray(address)) {
                result = {
                    address: address[0],
                    responseTime: ipv6endDate - endDate,
                };
            } else {
                result = address;
            }
            debug(`Query to ${hostname} returned ${result}`);
            return result;
        })
        .catch((error) => {
            debug(`Error: Query returned ${error}`);
            Promise.reject(error);
        });
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { dnsPoll };

