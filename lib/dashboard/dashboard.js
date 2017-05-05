/**
 * @fileoverview Main dashboard logic
 * @module dashboard
 * @author Nayef Ghattas
 */

/* eslint new-cap: 0 */

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const chalk = require('chalk');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

const { checkIfDaemonIsUp, getActivelyPolledHosts } = require('./dashboard-daemon.js');
const { DatabaseConnector } = require('./dashboard-data.js');

// ------------------------------------------------------------------------------
// Start dashboard
// ------------------------------------------------------------------------------

checkIfDaemonIsUp().then(() => getActivelyPolledHosts()).then((hosts) => {
    const screen = blessed.screen();
    const databaseConnect = new DatabaseConnector(hosts);

    // Each screen corresponds to a website
    const screens = hosts.website.map(website => (screenPage) => {
        const grid = new contrib.grid({ rows: 12, cols: 12, screen: screenPage });

        // Add to each screen the boxes
        const box = grid.set(0, 0, 1, 12, blessed.box, { content: website.url, align: 'center' });
        const log = grid.set(1, 0, 6, 6, contrib.log, { label: 'Aggregate metrics for 10m' });
        const logHour = grid.set(1, 6, 6, 6, contrib.log, { label: 'Aggregate metrics hourly' });
        const alerts = grid.set(7, 0, 5, 12, blessed.list, {
            style: {
                selected: {
                    fg: 'blue',
                },
            },
            keys: true,
            label: 'Alerts',
        });

        /**
         * Helper function for refreshing the rolling logs
         * @return {void}
         */
        function refreshLogs(timeframe, logger) {
            logger.log(chalk.bold.underline(new Date(Date.now()).toString()));
            Promise.all(databaseConnect.getLogs(website.url, timeframe)).then(array =>
                array.forEach(lineLog => logger.log(lineLog))
            );
        }

        /**
         * Helper function to initialize all alerts
         * @return {void}
         */
        function initializeAlerts() {
            databaseConnect.getAlerts(website.url).then((alertsInit) => {
                alerts.setItems(alertsInit);
                alerts.focus();
            });
        }

        /**
         * Helper function to query latest alerts and add them to the list
         * @return {void}
         */
        function addAlerts() {
            databaseConnect.getLatestAlerts(website.url).then((alertsLatest) => {
                alertsLatest.forEach(alert => alerts.insertItem(0, alert));
            });
        }

        // refresh logs and alerts for last hour every minut
        refreshLogs('1h', logHour);
        setInterval(() => refreshLogs('1h', logHour), 60000);

        // refresh logs and alerts for last 10m every 10s
        refreshLogs('10m', log);
        setInterval(() => refreshLogs('10m', log), 10000);

        setInterval(addAlerts, 4000);
        initializeAlerts();

        // adapt box size on screen resize
        screenPage.on('resize', () => {
            log.emit('attach');
            box.emit('attach');
            alerts.emit('attach');
            logHour.emit('attach');
        });
    });

    // quit the dashboard with the corresponding keys
    screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

    screen.render();

    // Render the carousel with the different websites
    const carousel = new contrib.carousel(screens, {
        screen,
        interval: 0, // how often to switch views (set 0 to never swicth automatically)
        controlKeys: true, //should right and left keyboard arrows control view rotation
    });
    carousel.start();
});

