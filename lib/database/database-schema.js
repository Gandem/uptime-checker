/**
 * @fileoverview Schema of the database
 * @module database/schema
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const { FieldType } = require('influx');

// ------------------------------------------------------------------------------
// Schema
// ------------------------------------------------------------------------------

const schema = [
    {
        measurement: 'http_response_time',
        fields: {
            duration: FieldType.INTEGER,
        },
        tags: ['host'],
    },
    {
        measurement: 'http_response_code',
        tags: ['host'],
        fields: { code: FieldType.STRING },
    },
    {
        measurement: 'http_ttfb',
        tags: ['host'],
        fields: { duration: FieldType.INTEGER },
    },
    {
        measurement: 'dns_ip',
        tags: ['host'],
        fields: { ip: FieldType.STRING },
    },
    {
        measurement: 'dns_response_time',
        tags: ['host'],
        fields: { duration: FieldType.INTEGER },
    },
    {
        measurement: 'http_error',
        tags: ['host'],
        fields: { error: FieldType.STRING },
    },
    {
        measurement: 'dns_error',
        tags: ['host'],
        fields: { error: FieldType.STRING },
    },
    {
        measurement: 'availability',
        tags: ['host'],
        fields: { percentage: FieldType.FLOAT },
    },
    {
        measurement: 'alert',
        tags: ['host'],
        fields: { error: FieldType.STRING },
    },
];

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { schema };

