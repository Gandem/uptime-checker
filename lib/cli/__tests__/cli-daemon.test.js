/**
 * @fileoverview Tests for cli-daemon public API
 * @author Nayef Ghattas
 */

/* eslint global-require: 0 */
/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Importing Mocks
// ------------------------------------------------------------------------------

jest.mock('fs');
jest.mock('../../daemon/daemon-messaging.js');
jest.mock('child_process');

console.log = jest.fn();

// Using fake timers to make it work smoothly with promises
// @see https://github.com/facebook/jest/issues/672
jest.useFakeTimers();

const { sendMessageToDaemon } = require('../../daemon/daemon-messaging.js');

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

describe('daemonStart', () => {
    const childProcess = require('child_process');
    const { daemonStart } = require('../cli-daemon.js');

    test('start daemon when daemon is stopped', () => {
        sendMessageToDaemon.$fail();
        daemonStart();
        jest.runAllTimers();
        expect(childProcess.spawn).toBeCalled();
        expect(console.log.mock.calls).toEqual(expect.stringMatching('started'));
        childProcess.spawn.mockClear();
        console.log.mockClear();
    });

    test('start daemon with a configuration file', () => {
        sendMessageToDaemon.$fail();
        daemonStart({ argv: { configurationFile: 'hellotest' } });
        jest.runAllTimers();
        expect(childProcess.spawn.mock.calls[0][1]).toEqual(expect.stringMatching('hellotest'));
        expect(console.log.mock.calls).toEqual(expect.stringMatching('started'));
        childProcess.spawn.mockClear();
        console.log.mockClear();
    });

    test("don't start daemon when daemon is already started", () => {
        sendMessageToDaemon.$succeed();
        daemonStart();
        jest.runAllTimers();
        expect(childProcess.spawn).not.toBeCalled();
        expect(console.log.mock.calls).toEqual(expect.stringMatching('already running'));
        childProcess.spawn.mockClear();
        console.log.mockClear();
    });
});

describe('daemonStop', () => {
    const { daemonStop } = require('../cli-daemon.js');

    test('stop daemon when daemon is started', () => {
        sendMessageToDaemon.$succeed();
        daemonStop();
        jest.runAllTimers();
        expect(console.log.mock.calls).toEqual(expect.stringMatching('now stopped'));
        console.log.mockClear();
    });

    test("don't stop daemon when daemon is already stopped", () => {
        sendMessageToDaemon.$fail();
        daemonStop();
        jest.runAllTimers();
        expect(console.log.mock.calls).toEqual(expect.stringMatching('already stopped'));
        console.log.mockClear();
    });
});

describe('daemonStatus', () => {
    test('says daemon is started with one website', () => {
        const { daemonStatus } = require('../cli-daemon.js');
        sendMessageToDaemon.$succeed();
        daemonStatus();
        jest.runAllTimers();
        expect(console.log.mock.calls).toEqual(expect.stringMatching(/is running(.|\n)*google/));
        console.log.mockClear();
    });

    test('says daemon is started with multiples websites', () => {
        const { daemonStatus } = require('../cli-daemon.js');
        sendMessageToDaemon.$succeed();
        sendMessageToDaemon.$setWebsite([
            {
                url: 'http://google.com',
            },
            {
                url: 'http://test.com',
            },
        ]);
        daemonStatus();
        jest.runAllTimers();
        expect(console.log.mock.calls).toEqual(
            expect.stringMatching(/is running(.|\n)*google(.|\n)*test/)
        );
        console.log.mockClear();
    });

    test('says daemon is stopped', () => {
        const { daemonStatus } = require('../cli-daemon.js');

        sendMessageToDaemon.$fail();
        daemonStatus();
        jest.runAllTimers();
        expect(console.log.mock.calls).toEqual(expect.stringMatching('not running'));
        console.log.mockClear();
    });
});

