/**
 * @fileoverview Daemon class regrouping daemons common configuration
 * @module daemon
 * @author Nayef Ghattas
 */

/* eslint global-require: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const ipc = require('node-ipc');

const { loadAndValidate, getFirstValidConfiguration } = require('../config/config.js');
const { createInfluxDatabase } = require('../database/database');
const { handleErrorThenExit, dumpErrorFileThenExit } = require('../util/errors');

// ------------------------------------------------------------------------------
// Class
// ------------------------------------------------------------------------------

/**
 * Class representing a running Daemon
 */
class Daemon {
    /**
   * Create a Daemon
   * @param {Object} configurationObject daemon configuration object
   * @param {string} configurationObject.configurationFile path to the configuration file
   * @param {string} configurationObject.IPCID ID of the daemon IPC
   * @param {string} configurationObject.IPCSocketRoot Root path for IPC socket
   */
    constructor({ configurationFile, IPCID, IPCSocketRoot }) {
        this.configurationFile = configurationFile || null;
        this.configuration = null;
        this.IPC = new ipc.IPC();

        this.configureIPCServer({ IPCID, IPCSocketRoot });
        this.loadConfiguration();
        this.writePointToDatabase = this.writePointToDatabase.bind(this);
    }

    /**
   * Basic configuration helper for an IPC server or client
   * @param {Object} configurationObject IPC configuration object
   * @param {string} configurationObject.IPCID ID of the daemon IPC
   * @param {string} configurationObject.IPCSocketRoot Root path for IPC socket
   */
    configureIPCServer({ IPCID, IPCSocketRoot }) {
        this.IPC.config.id = IPCID;
        this.IPC.config.socketRoot = IPCSocketRoot;
        this.IPC.config.retry = 1500;
        this.IPC.config.silent = true;
    }

    /**
   * Helper to load the application configuration file
   */
    loadConfiguration() {
        if (this.configurationFile !== null) {
            const configurationObject = loadAndValidate(this.configurationFile);
            if (configurationObject instanceof Error) {
                handleErrorThenExit(configurationObject.message);
            } else {
                this.configuration = configurationObject;
            }
        } else {
            this.configuration = getFirstValidConfiguration();
        }
        this.database = createInfluxDatabase(this.configuration.database);
    }

    /**
    * Helper function for writing a set of points in a influxDB database
    * This function will be passed to the pollers, so they can easily write to database
    * (that's why the function "this" is bound in the constructor)
    * @param {Array} points Array of points per node-influx specification
    */
    writePointToDatabase(points) {
        this.database.writePoints(points).catch((error) => {
            if (error.message.indexOf('database not found') !== -1) {
                this.database.createDatabase(
                    (this.configuration.database && this.configuration.database.database) ||
                        'uptime-checker'
                );
            } else {
                dumpErrorFileThenExit(error.message);
            }
        });
    }
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { Daemon };

