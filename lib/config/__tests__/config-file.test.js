/**
 * @fileoverview Tests for config-file public API
 * @author Nayef Ghattas
 */

/* eslint global-require: 0 */
/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Importing Mocks
// ------------------------------------------------------------------------------

jest.mock('fs');

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

describe('findConfigurationFiles', () => {
    let fs = require('fs');
    const { USER_HOME, UPTIME_CHECKER_HOME } = require('../../util/constants');
    let { findConfigurationFiles } = require('../config-file');

    test('finds configuration files in correct order', () => {
        fs.$setMockFiles({
            '/path/to/file1.js': 'console.log("file1 contents");',
            '/path/to/file2.txt': 'file2 contents',
            [`${USER_HOME}/uptime-checker.json`]: '',
            [`${UPTIME_CHECKER_HOME}/uptime-checker.json`]: '',
            [`${USER_HOME}/.uptime-checker.conf`]: '',
        });

        expect(findConfigurationFiles()).toEqual([
            `${UPTIME_CHECKER_HOME}/uptime-checker.json`,
            `${USER_HOME}/uptime-checker.json`,
            `${USER_HOME}/.uptime-checker.conf`,
        ]);
    });

    test('returns error if no configuration files found', () => {
        fs.$setMockFiles({});
        expect(findConfigurationFiles() instanceof Error).toBe(true);
    });

    test('searches /etc on a Linux-based operating system', () => {
        jest.setMock('../../util/constants.js', {
            OPERATING_SYSTEM: 'linux',
            USER_HOME,
            UPTIME_CHECKER_HOME,
        });
        jest.resetModules();
        fs = require('fs');
        findConfigurationFiles = require('../config-file').findConfigurationFiles;

        fs.$setMockFiles({
            '/etc/uptime-checker/uptime-checker.conf': '',
            [`${USER_HOME}/uptime-checker.json`]: '',
            [`${UPTIME_CHECKER_HOME}/uptime-checker.json`]: '',
        });

        const configurationFiles = findConfigurationFiles();

        expect(configurationFiles).toEqual([
            '/Users/gandem/Projects/datadog/uptime-checker.json',
            '/Users/gandem/uptime-checker.json',
            '/etc/uptime-checker/uptime-checker.conf',
        ]);
    });

    test('ignore /etc on a non Linux-base operating system', () => {
        jest.setMock('../../util/constants.js', {
            OPERATING_SYSTEM: 'darwin',
            USER_HOME,
            UPTIME_CHECKER_HOME,
        });
        jest.resetModules();
        fs = require('fs');
        findConfigurationFiles = require('../config-file').findConfigurationFiles;

        fs.$setMockFiles({
            '/etc/uptime-checker/uptime-checker.conf': '',
            [`${USER_HOME}/uptime-checker.json`]: '',
            [`${UPTIME_CHECKER_HOME}/uptime-checker.json`]: '',
        });

        const configurationFiles = findConfigurationFiles();

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

