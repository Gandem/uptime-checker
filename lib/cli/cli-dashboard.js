/**
 * @fileoverview Functions to start the dashboard
 * @module cli/dashboard
 * @author Nayef Ghattas
 */

/* eslint no-console: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const childProcess = require('child_process');

const { UPTIME_CHECKER_HOME } = require('../util/constants.js');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Function to start a dashboard instance
 * @return {void}
 */
function dashboardStart() {
    childProcess.spawn('node', [`${UPTIME_CHECKER_HOME}/lib/dashboard/dashboard.js`], {
        detached: false,
        stdio: 'inherit',
    });
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { dashboardStart };

