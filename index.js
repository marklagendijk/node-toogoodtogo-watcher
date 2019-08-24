#!/usr/bin/env node
const { pollFavoriteBusinesses } = require('./lib/poller');
const { notifyIfChanged } = require('./lib/notifier');
const { editConfig, resetConfig } = require('./lib/config');

const argv = require('yargs')
    .usage('Usage: toogoodtogo-watcher <command>')
    .command('config', 'Edit the config file.', {
        reset: {
            type: 'boolean',
            default: false
        }
    })
    .command('watch', 'Watch your favourite busininesses for changes.')
    .demandCommand()
    .argv;

switch(argv._[0]){
    case 'config':
        if(argv.reset){
            resetConfig();
        }
        editConfig();
        break;
    case 'watch':
        pollFavoriteBusinesses()
            .subscribe(businesses => notifyIfChanged(businesses), console.error);
        break;
}