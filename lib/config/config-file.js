/**
 * @fileoverview Helper to locate and load configuration file.
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const fs = require('fs');
const chalk = require('chalk');
const stripbom = require('strip-bom');
const path = require('path');
const os = require('os');
const Promise = require('bluebird');

const debug = require('debug')('uptime-checker:config');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Wrapper for reading synchronously a file
 * @param {varType} filePath The path of the file to load
 * @returns {string} The parsed file read in UTF-8
 */
function readFile(filePath) {
    return stripbom(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Load the JSON Configuration file from the file path
 * @param {string} filePath The path of the file to load
 * @returns {Promise} A Promise to the configurationObject
 * @resolve {Object} The configurationObject
 * @rejects {Error} An Error indicating the JSON could not be parsed
 */
function loadConfigurationFile(filePath) {
    debug(`Loading configuration file from ${filePath}`);

    try {
        return Promise.resolve(JSON.parse(readFile(filePath)));
    } catch (err) {
        debug(`${chalk.red.bold('Error:')} could not read configuration file from ${filePath}`);
        err.message = `Unable to read the ${chalk.bold('configuration file')} in ${filePath} \n Error: ${err.message}`;
        return Promise.reject(err);
    }
}

/**
 * Searches the FileSystem for the configuration file in the following order:
 * - The uptime-checker project directory
 * - The user's home directory
 * - (Only on a Linux Operating System) In /etc/uptime-checker/
 * @returns {Promise} A promise to the configuration files paths
 * @resolve {Array} The configuration files paths
 * @reject {Error} If no configuration file could not be found
 */
function findConfigurationFiles() {
    // The order here is to prefer visible files to hidden files (for UX purposes)
    // And prefer .json to .conf because the file is a JSON
    const fileNames = [
        'uptime-checker.json',
        'uptime-checker.conf',
        '.uptime-checker.json',
        '.uptime-checker.conf',
    ];

    const projectPath = path.resolve(`${__dirname}/../../`);
    const userHome = os.homedir();

    const directoriesToSearch = [projectPath, userHome];

    if (os.platform() === 'linux') {
        directoriesToSearch.push('/etc/uptime-checker');
    }

    const filePossibleLocations = directoriesToSearch.reduce(
        (array, directory) => array.concat(fileNames.map(filename => `${directory}/${filename}`)),
        []
    );

    const availableConfigurationFiles = filePossibleLocations.filter((fileLocation) => {
        debug(`Searching for configuration file in ${fileLocation}`);
        return fs.existsSync(fileLocation);
    });

    if (availableConfigurationFiles.length !== 0) {
        debug(`Found configuration file in ${chalk.dim(...availableConfigurationFiles)}`);
        return Promise.resolve(availableConfigurationFiles);
    }
    debug(chalk.bold('Configuration files not found'));
    return Promise.reject(
        new Error(
            'Could not find any uptime-checker configuration file \n' +
                'Be sure to check in : \n' +
                ` ${chalk.bold('* -')} The uptime-checker project directory \n` +
                ` ${chalk.bold('* -')} The user's home directory \n` +
                ` ${chalk.bold('* -')} ${chalk.dim('(Only on a Linux-based Operating System)')} In /etc/uptime-checker/ \n`
        )
    );
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { loadConfigurationFile, findConfigurationFiles };

