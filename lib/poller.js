const _ = require('lodash');
const { from, interval } = require('rxjs');
const { flatMap, startWith, filter, map } = require('rxjs/operators');
const { config } = require('./config');
const api = require('./api');

const MINIMAL_POLLING_INTERVAL = 15000;

module.exports = {
    pollFavoriteBusinesses
}

function pollFavoriteBusinesses(){
    const configuredPollingIntervalInMs = config.get('api.intervalInMs');
    const pollingIntervalInMs = _.isFinite(configuredPollingIntervalInMs) ? 
        Math.max(configuredPollingIntervalInMs, MINIMAL_POLLING_INTERVAL) :
        MINIMAL_POLLING_INTERVAL;
    return from(api.login()).pipe(
        flatMap(() => interval(pollingIntervalInMs).pipe(startWith(0))),
        flatMap(() => api.listFavoriteBusinesses()),
        filter(response => response.info),
        map(response => response.info)
    );
}