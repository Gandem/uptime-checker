'use strict';

const chalk = require('chalk');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

const { checkIfDaemonIsUp, getActivelyPolledHosts } = require('./dashboard-daemon.js');
const { DatabaseConnector } = require('./dashboard-data.js');

checkIfDaemonIsUp().then(() => getActivelyPolledHosts()).then((hosts) => {
    const screen = blessed.screen();
    const databaseConnect = new DatabaseConnector(hosts);

    const screens = hosts.website.map(website => (screenPage) => {
        const grid = new contrib.grid({ rows: 12, cols: 12, screen: screenPage });

        const box = grid.set(0, 0, 1, 12, blessed.box, { content: website.url, align: 'center' });
        const log = grid.set(1, 0, 6, 6, contrib.log, { label: 'Aggregate metrics' });
        const errors = grid.set(7, 0, 5, 12, blessed.list, {
            style: {
                selected: {
                    fg: 'blue',
                },
            },
            keys: true,
            label: 'Alerts',
        });

        function refreshLogs() {
            log.log(chalk.bold.underline(new Date(Date.now()).toString()));
            Promise.all(databaseConnect.getRecentLogs(website.url)).then(array =>
                array.forEach(lineLog => log.log(lineLog))
            );
        }

        function initializeAlerts() {
            databaseConnect.getAlerts(website.url).then((alerts) => {
                errors.setItems(alerts);
                errors.focus();
            });
        }

        function addAlerts() {
            databaseConnect.getLatestAlerts(website.url).then((alerts) => {
                alerts.forEach(alert => errors.insertItem(0, alert));
            });
        }

        refreshLogs();
        setInterval(refreshLogs, 10000);

        setInterval(addAlerts, 4000);
        initializeAlerts();
        addAlerts();
        errors.focus();

        screenPage.on('resize', () => {
            log.emit('attach');
            box.emit('attach');
            errors.emit('attach');
        });
    });
    screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

    screen.render();

    const carousel = new contrib.carousel(screens, {
        screen,
        interval: 0, // how often to switch views (set 0 to never swicth automatically)
        controlKeys: true, //should right and left keyboard arrows control view rotation
    });
    carousel.start();
});

