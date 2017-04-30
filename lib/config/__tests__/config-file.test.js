/**
 * @fileoverview Tests for config-file public API
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

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

describe('findConfigurationFiles', () => {
    const { findConfigurationFiles } = require('../config-file');
    const fs = require('fs');
    const os = require('os');

    test('finds configuration files in correct order', () => {
        fs.$setMockFiles({
            '/path/to/file1.js': 'console.log("file1 contents");',
            '/path/to/file2.txt': 'file2 contents',
            [`${os.homedir()}/uptime-checker.json`]: '',
            [path.resolve(`${__dirname}/../../../uptime-checker.json`)]: '',
            [`${os.homedir()}/.uptime-checker.conf`]: '',
        });

        expect(findConfigurationFiles()).toEqual([
            path.resolve(`${__dirname}/../../../uptime-checker.json`),
            `${os.homedir()}/uptime-checker.json`,
            `${os.homedir()}/.uptime-checker.conf`,
        ]);
    });

    test('returns error if no configuration files found', () => {
        fs.$setMockFiles({});
        expect(findConfigurationFiles() instanceof Error).toBe(true);
    });

    test('searches /etc on a Linux-based operating system', () => {
        os.$setOs('linux');

        fs.$setMockFiles({
            '/etc/uptime-checker/uptime-checker.conf': '',
            [`${os.homedir()}/uptime-checker.json`]: '',
            [path.resolve(`${__dirname}/../../../uptime-checker.json`)]: '',
        });

        const configurationFiles = findConfigurationFiles();
        os.$resetOs();

        expect(configurationFiles).toEqual([
            '/Users/gandem/Projects/datadog/uptime-checker.json',
            '/Users/gandem/uptime-checker.json',
            '/etc/uptime-checker/uptime-checker.conf',
        ]);
    });

    test('ignore /etc on a non Linux-base operating system', () => {
        os.$setOs('darwin');

        fs.$setMockFiles({
            '/etc/uptime-checker/uptime-checker.conf': '',
            [`${os.homedir()}/uptime-checker.json`]: '',
            [path.resolve(`${__dirname}/../../../uptime-checker.json`)]: '',
        });

        const configurationFiles = findConfigurationFiles();
        os.$resetOs();

        expect(configurationFiles).toEqual([
            '/Users/gandem/Projects/datadog/uptime-checker.json',
            '/Users/gandem/uptime-checker.json',
        ]);
    });
});

describe('loadConfigurationFile', () => {
    const { loadConfigurationFile } = require('../config-file.js');
    const fs = require('fs');

    test('loads configuration file', () => {
        fs.$setMockFiles({
            'uptime-checker.json': `{ 
              "websites": {
                  "url": "google.com"
              }
            }`,
        });

        expect(loadConfigurationFile('uptime-checker.json')).toEqual({
            websites: {
                url: 'google.com',
            },
        });
    });

    test('throws if configuration file is not a correct JSON', () => {
        fs.$setMockFiles({
            'uptime-checker.json': `{ 
              "websites": {
                  "url": "google.com",
              }
            }`,
        });
        expect(loadConfigurationFile('uptime-checker.json') instanceof Error).toBe(true);
    });
});

