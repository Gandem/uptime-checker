/**
 * A mock for daemon-messaging, to avoid spawning an IPC instance
 * @fileoverview Mock for daemon-messaging
 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const Promise = require('bluebird');

// ------------------------------------------------------------------------------
// Mock definition and functions
// ------------------------------------------------------------------------------

let messagingFail = false;
let website = [
    {
        url: 'http://www.google.com',
    },
];
const sendMessageToDaemon = jest.fn((clientID, message) => {
    if (messagingFail === false) {
        if (message.type === 'status') {
            return Promise.resolve({
                message: {
                    website,
                },
            });
        }
        return Promise.resolve();
    }
    return Promise.reject();
});

sendMessageToDaemon.$fail = () => (messagingFail = true);

sendMessageToDaemon.$succeed = () => (messagingFail = false);

sendMessageToDaemon.$setWebsite = testWebsite => (website = testWebsite);

module.exports = { sendMessageToDaemon };

