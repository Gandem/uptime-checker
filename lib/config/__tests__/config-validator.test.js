/**
 * @fileoverview Tests for config-validator public API
 * @author Nayef Ghattas
 */

/* eslint global-require: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Configuration objects Mocks
// ------------------------------------------------------------------------------

const VALID_CONFIGURATIONS = [
    {
        website: {
            url: 'http://www.google.com/bite',
            check_interval: '15',
        },
        check_interval: '2000',
    },
    {
        website: [{ url: 'https://www.google' }, { url: 'http://test.com', check_interval: '500' }],
    },
    {
        website: {
            url: 'http://138.195.130.72/index.html',
        },
    },
];

const COERCED_VALID_CONFIGURATIONS = [
    {
        website: [
            {
                url: 'http://www.google.com/bite',
                check_interval: 15,
            },
        ],
        check_interval: 2000,
    },
    {
        website: [{ url: 'https://www.google' }, { url: 'http://test.com', check_interval: 500 }],
    },
    {
        website: [
            {
                url: 'http://138.195.130.72/index.html',
            },
        ],
    },
];

const INVALID_CONFIGURATIONS = [
    {
        website: {
            port: '123',
        },
    },
    {
        website: [
            {
                url: 'http://google.com',
                port: '124a',
            },
        ],
    },
    {
        website: {
            url: 'google.com',
        },
    },
];

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

describe('validateConfiguration', () => {
    const { validateConfiguration } = require('../config-validator.js');
    test('validates valid configuration objects', () => {
        VALID_CONFIGURATIONS.forEach((configuration, index) => {
            expect(validateConfiguration(configuration)).toEqual(
                COERCED_VALID_CONFIGURATIONS[index]
            );
        });
    });

    test('rejects invalid configuration object', () => {
        INVALID_CONFIGURATIONS.forEach((configuration) => {
            expect(validateConfiguration(configuration) instanceof Error).toBe(true);
        });
    });
});

