/**
 * A mock for child_process, to avoid actually spawning a process
 * @fileoverview Mock for child_process
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const EventEmitter = require('events').EventEmitter;

// ------------------------------------------------------------------------------
// Mock definition and functions
// ------------------------------------------------------------------------------

const childProcess = jest.genMockFromModule('child_process');

childProcess.spawn = jest.fn(() => {
    const daemon = new EventEmitter();
    daemon.unref = jest.fn();
    return daemon;
});

module.exports = childProcess;

