/**
 * A mock for fs, to avoid actually hitting the disk
 * @fileoverview Mock for NodeJS fs module
 * Inspired by : https://facebook.github.io/jest/docs/manual-mocks.html
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const path = require('path');

// ------------------------------------------------------------------------------
// Mock definition and functions
// ------------------------------------------------------------------------------

const fs = jest.genMockFromModule('fs');

let mockFiles = Object.create(null);

/**
 * This is a custom function that our tests can use during setup to specify
 * what the files on the "mock" filesystem should look like when any of the
 * `fs` APIs are used.
 * @param {Object} newMockFiles Mock FileSystem
 * @returns {void}
 * For example:
 * {
 *   '/path/to/file1.js': 'console.log("file1 contents");',
 *   '/path/to/file2.txt': 'file2 contents',
 * };
 */
function $setMockFiles(newMockFiles) {
    mockFiles = Object.create(null);
    Object.keys(newMockFiles).forEach((mockFilePath) => {
        const dir = path.dirname(mockFilePath);
        if (!mockFiles[dir]) {
            mockFiles[dir] = {};
        }
        mockFiles[dir][path.basename(mockFilePath)] = newMockFiles[mockFilePath];
    });
}

/** A custom version of `readFileSync` that reads from the special mocked out
 * file list set via $setMockFiles
 * @param {string} filePath The file path in our "mock" filesystem
 * @returns {string} The file contents
 * @throw {Error} If file doesn't exist
 */
function readFileSync(filePath) {
    const dir = path.dirname(filePath);
    const file = path.basename(filePath);

    if (mockFiles[dir] !== undefined && mockFiles[dir][file] !== undefined) {
        return mockFiles[dir][file];
    }
    throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
}

/** A custom version of `existsSync` that reads from the special mocked out
 * file list set via $setMockFiles
 * @param {string} filePath The file path in our "mock" filesystem
 * @returns {boolean} Boolean representing the existence of the file
 */
function existsSync(filePath) {
    const dir = path.dirname(filePath);
    const file = path.basename(filePath);

    if (mockFiles[dir] !== undefined && mockFiles[dir][file] !== undefined) {
        return true;
    }
    return false;
}

// ------------------------------------------------------------------------------
// Mock export
// ------------------------------------------------------------------------------

fs.$setMockFiles = $setMockFiles;
fs.readFileSync = readFileSync;
fs.existsSync = existsSync;

module.exports = fs;

