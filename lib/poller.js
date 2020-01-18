const _ = require('lodash');
const { interval } = require('rxjs');
const { flatMap, startWith, filter, map, withLatestFrom, retry } = require('rxjs/operators');
const { config } = require('./config');
const api = require('./api');

const MINIMAL_POLLING_INTERVAL = 15000;
const MINIMAL_AUTHENTICATION_INTERVAL = 86400000;

module.exports = {
    pollFavoriteBusinesses
};

function pollFavoriteBusinesses(){
    const pollingIntervalInMs = getInterval('api.pollingIntervalInMs', MINIMAL_POLLING_INTERVAL)
    const authenticationIntervalInMs = getInterval('api.authenticationIntervalInMS', MINIMAL_AUTHENTICATION_INTERVAL);

    const authentication$ = interval(authenticationIntervalInMs).pipe(
        startWith(0),
        flatMap(() => api.login()),
        retry(2)
    );

    return interval(pollingIntervalInMs).pipe(
        startWith(0),
        withLatestFrom(authentication$),
        flatMap(() => api.listFavoriteBusinesses()),
        filter(response => response.items),
        map(response => response.items),
        retry(2)
    );
}

function getInterval(configPath, minimumIntervalInMs){
    const configuredIntervalInMs = config.get(configPath);
    return _.isFinite(configuredIntervalInMs) ?
        Math.max(configuredIntervalInMs, minimumIntervalInMs) :
        minimumIntervalInMs;
}
