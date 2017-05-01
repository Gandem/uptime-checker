/**
 * @fileoverview Tests for config public API
 * @author Nayef Ghattas
 */

/* eslint global-require: 0 */
/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const path = require('path');

// ------------------------------------------------------------------------------
// Importing Mocks
// ------------------------------------------------------------------------------

jest.mock('fs');
jest.mock('os');

console.error = jest.fn();
console.warn = jest.fn();
process.exit = jest.fn();

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

describe('getFirstValidConfiguration', () => {
    const { getFirstValidConfiguration } = require('../config.js');
    const fs = require('fs');
    const os = require('os');

    test('find valid configuration file', () => {
        fs.$setMockFiles({
            [`${os.homedir()}/uptime-checker.json`]: `{
                "website": {
                    "url": "http://google.com"
                }
            }`,
        });

        expect(getFirstValidConfiguration()).toEqual({ website: [{ url: 'http://google.com' }] });
    });

    test('file has priority but could not be parsed as json', () => {
        fs.$setMockFiles({
            [`${os.homedir()}/uptime-checker.json`]: `{
                "website": {
                    "url": "http://google.com"
                }
            }`,
            [path.resolve(`${__dirname}/../../../uptime-checker.json`)]: '',
        });

        expect(getFirstValidConfiguration()).toEqual({ website: [{ url: 'http://google.com' }] });
        expect(console.warn.mock.calls[0]).toEqual(expect.stringMatching(/WARNING.*JSON/));
        console.warn.mockClear();
    });

    test('file has priority but it statically invalid', () => {
        fs.$setMockFiles({
            [`${os.homedir()}/uptime-checker.json`]: `{
                "website": {
                    "url": "http://google.com"
                }
            }`,
            [path.resolve(`${__dirname}/../../../uptime-checker.json`)]: '{}',
        });

        expect(getFirstValidConfiguration()).toEqual({ website: [{ url: 'http://google.com' }] });
        expect(console.warn.mock.calls[0]).toEqual(
            expect.stringMatching(/WARNING.*invalid configuration/)
        );
        console.warn.mockClear();
    });

    test('no valid file configuration found', () => {
        fs.$setMockFiles({
            [`${os.homedir()}/uptime-checker.json`]: `{
                "website": {
                    "url": "http://google.com",
                }
            }`,
            [path.resolve(`${__dirname}/../../../uptime-checker.json`)]: '{}',
        });

        expect(getFirstValidConfiguration()).toThrow();
        expect(console.error.mock.calls.length).toBe(1);
        expect(process.exit.mock.calls.length).toBe(1);
        expect(console.error.mock.calls).toEqual(expect.stringMatching(/ERROR.*invalid/));
        process.exit.mockClear();
        console.error.mockClear();
        console.warn.mockClear();
    });

    test('no configuration file found', () => {
        fs.$setMockFiles({
            [`${os.homedir()}/hey`]: '',
            [path.resolve(`${__dirname}/../../../hello`)]: '',
        });

        expect(getFirstValidConfiguration()).toThrow();
        expect(process.exit.mock.calls.length).toBe(1);
        expect(console.error.mock.calls[0][0]).toEqual(
            expect.stringContaining('not find any uptime-checker configuration file')
        );
    });
});

