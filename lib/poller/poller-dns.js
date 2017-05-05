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
// Functions
// ------------------------------------------------------------------------------

/**
 * @function
 * @description Wrapper around dns.resolve for debugging purposes
 * @param {string} hostname The hostname to be polled
 * @returns {Promise<string|Error>} Promise to an IPv4 or IPv6 address
 */
const dnsPoll = Promise.method(
    hostname =>
        new Promise((resolve, reject) => {
            debug(`Trying to resolve ${hostname} with DNS`);
            const startDate = Date.now();
            dns.resolve(hostname, (err, address) => {
                const endDate = Date.now();
                if (err !== null) return reject(err);
                if (address.length === 0) {
                    dns.resolve(hostname, 'AAAA', (errv6, addressv6) => {
                        if (errv6 !== null) return reject(errv6);
                        const endDatev6 = Date.now();
                        return resolve({
                            address: addressv6[0],
                            responseTime: endDatev6 - endDate,
                        });
                    });
                }
                return resolve({
                    address: address[0],
                    responseTime: endDate - startDate,
                });
            });
        })
);

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { dnsPoll };

