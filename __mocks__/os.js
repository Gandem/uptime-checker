/**
 * A mock for os, to test behaviour on other OSes
 * @fileoverview Mock for NodeJS os module
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

jest.unmock('os');
const os = require('os');

// ------------------------------------------------------------------------------
// Mock definition and functions
// ------------------------------------------------------------------------------

let operatingSystem = os.platform();
const originOperatingSystem = os.platform();
os.platform = jest.fn(() => operatingSystem);
os.$setOs = (operatingSystemString) => {
    operatingSystem = operatingSystemString;
};
os.$resetOs = () => {
    operatingSystem = originOperatingSystem;
};

// ------------------------------------------------------------------------------
// Mock export
// ------------------------------------------------------------------------------

module.exports = os;

