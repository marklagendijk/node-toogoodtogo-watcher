#!/usr/bin/env node
const { pollFavoriteBusinesses } = require('./lib/poller');
const { notifyIfChanged } = require('./lib/notifier');
const { editConfig, resetConfig, configPath } = require('./lib/config');

const argv = require('yargs')
    .usage('Usage: toogoodtogo-watcher <command>')
    .command('config', 'Edit the config file.')
    .command('config-reset', 'Reset the config to the default values.')
    .command('config-path', 'Show the path of the config file.')
    .command('watch', 'Watch your favourite busininesses for changes.')
    .demandCommand()
    .argv;

switch (argv._[0]) {
case 'config':
    editConfig();
    break;

case 'config-reset':
    resetConfig();
    break;

case 'config-path':
    configPath();
    break;

case 'watch':
    pollFavoriteBusinesses()
        .subscribe(businesses => notifyIfChanged(businesses), console.error);
    break;
}
