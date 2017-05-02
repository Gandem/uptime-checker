'use strict';

const path = require('path');
const os = require('os');

const UPTIME_CHECKER_HOME = path.resolve(`${__dirname}/../../`);
const USER_HOME = os.homedir();
const OPERATING_SYSTEM = os.platform();

module.exports = {
    UPTIME_CHECKER_HOME,
    USER_HOME,
    OPERATING_SYSTEM,
};

