/**
 * @fileoverview Tests for config public API
 * @author Nayef Ghattas
 */

/* eslint global-require: 0 */
/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Importing Mocks
// ------------------------------------------------------------------------------

jest.mock('fs');

console.error = jest.fn();
console.warn = jest.fn();
process.exit = jest.fn();

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

describe('loadAndValidate', () => {
    const { loadAndValidate } = require('../config.js');
    const fs = require('fs');

    test('loads and validates a correct configuration file', () => {
        fs.$setMockFiles({
            'uptime-checker.json': `{
                "website": {
                    "url": "http://google.com"
                }
            }`,
        });

        expect(loadAndValidate('uptime-checker.json')).toEqual({
            website: [{ url: 'http://google.com' }],
        });
    });

    test('return error if invalid configuration file', () => {
        fs.$setMockFiles({
            'uptime-checker.json': '{}',
            'uptime-checker.conf': `{
                "website": {
                    "url": "http://google.com",
                }
            }`,
        });

        expect(loadAndValidate('uptime-checker.json') instanceof Error).toBe(true);
        expect(loadAndValidate('uptime-checker.conf') instanceof Error).toBe(true);
    });

    test('logs warning if invalid configuartion file on verbose', () => {
        fs.$setMockFiles({
            'uptime-checker.json': '{}',
            'uptime-checker.conf': `{
                "website": {
                    "url": "http://google.com",
                }
            }`,
        });

        loadAndValidate('uptime-checker.json', true);
        expect(console.warn.mock.calls.length).toBe(1);
        console.warn.mockClear();

        loadAndValidate('uptime-checker.conf', true);
        expect(console.warn.mock.calls.length).toBe(1);
        console.warn.mockClear();
    });
});

describe('getFirstValidConfiguration', () => {
    const { getFirstValidConfiguration } = require('../config.js');
    const { USER_HOME } = require('../../util/constants.js');
    const fs = require('fs');

    test('throws error if no configuration files found', () => {
        fs.$setMockFiles({
            'uptime-checker.json': '',
            'uptime-checker.conf': `{
                "website": {
                    "url": "http://google.com",
                }
            }`,
        });

        expect(getFirstValidConfiguration()).toThrow();
        expect(console.error.mock.calls.length).toBe(1);
        expect(process.exit.mock.calls.length).toBe(1);
        console.error.mockClear();
        process.exit.mockClear();
    });

    test('throws error if the only available configuration file is invalid', () => {
        fs.$setMockFiles({
            [`${USER_HOME}/uptime-checker.json`]: '',
        });

        expect(getFirstValidConfiguration({ warnOnPriority: false })).toThrow();
        expect(console.error.mock.calls.length).toBe(1);
        expect(process.exit.mock.calls.length).toBe(1);
        console.error.mockClear();
        process.exit.mockClear();
    });

    test('throws error if the only available configuration file is invalid', () => {
        fs.$setMockFiles({
            [`${USER_HOME}/uptime-checker.json`]: '',
            [`${USER_HOME}/uptime-checker.conf`]: '',
        });

        expect(getFirstValidConfiguration({ warnOnPriority: false })).toThrow();
        expect(console.error.mock.calls.length).toBe(1);
        expect(process.exit.mock.calls.length).toBe(1);
        console.error.mockClear();
        process.exit.mockClear();
    });

    test('return valid confguration file', () => {
        fs.$setMockFiles({
            [`${USER_HOME}/uptime-checker.json`]: `{
                "website": {
                    "url": "http://google.com"
                }
            }`,
        });

        expect(getFirstValidConfiguration()).toEqual({
            website: [{ url: 'http://google.com' }],
        });
    });

    test('warns if a higher priority configuration is ignored', () => {
        fs.$setMockFiles({
            [`${USER_HOME}/uptime-checker.json`]: '',
            [`${USER_HOME}/.uptime-checker.json`]: `{
                "website": {
                    "url": "http://google.com"
                }
            }`,
        });

        expect(getFirstValidConfiguration()).toEqual({
            website: [{ url: 'http://google.com' }],
        });
        expect(console.warn.mock.calls.length).toBe(2);
    });
});

