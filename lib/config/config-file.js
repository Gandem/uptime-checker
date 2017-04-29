/**
 * @fileoverview Helper to locate and load configuration file.
 * @author Nayef Ghattas
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const fs = require('fs');
const chalk = require('chalk');
const stripbom = require('strip-bom');
const path = require('path');
const os = require('os');

const debug = require('debug')('uptime-checker:config');

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Wrapper for reading synchronously a file
 * @param {varType} filePath The path of the file to load
 * @return {string} The parsed file read in UTF-8
 */
function readFile(filePath) {
    return stripbom(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Load the JSON Configuration file from the file path
 * @param {string} filePath The path of the file to load
 * @return {Object} The description from the configuration filePath
 * @throws {Error} If the file could not be loaded
 */
function loadConfigurationFile(filePath) {
    debug(`Loading configuration file from ${filePath}`);

    try {
        return JSON.parse(readFile(filePath));
    } catch (e) {
        debug(`${chalk.red.bold('Error:')} could not read configuration file from ${filePath}`);
        e.message = `Unable to read the ${chalk.bold('configuration file')} in ${filePath} \n Error: ${e.message}`;
        throw e;
    }
}

/**
 * Searches the FileSystem for the configuration file in the following order:
 * - The uptime-checker project directory
 * - The user's home directory
 * - (Only on a Linux Operating System) In /etc/uptime-checker/
 * @return {string} The configuration file path
 * @thows {Error} If the configuration file could not be found
 */
function findConfigurationFile() {
    const fileNames = [
        'uptime-checker.json',
        'uptime-checker.conf',
        '.uptime-checker.json',
        '.uptime-checker.conf',
    ];

    const projectPath = path.resolve(`${__dirname}/../../`);
    const userHome = os.homedir();

    const directoriesToSearch = [projectPath, userHome];
    if (os.platform() === 'linux') directoriesToSearch.push('/etc/uptime-checker');

    const filePossibleLocations = directoriesToSearch.reduce(
        (array, directory) => array.concat(fileNames.map(filename => `${directory}/${filename}`)),
        []
    );

    const configurationFile = filePossibleLocations.find((fileLocation) => {
        debug(`Searching for configuration file in ${fileLocation}`);
        return fs.existsSync(fileLocation);
    });

    if (configurationFile !== undefined) {
        return configurationFile;
    }
    debug(chalk.bold('Configuration file not found'));
    throw new Error('Could not find uptime-checker configuration file');
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { loadConfigurationFile, findConfigurationFile };

