const _ = require('lodash');
const { interval } = require('rxjs');
const { from } = require('rxjs');
const { flatMap, startWith, filter, map, withLatestFrom, retry, catchError } = require('rxjs/operators');
const { config } = require('./config');
const api = require('./api');

const MINIMAL_POLLING_INTERVAL = 15000;
const MINIMAL_AUTHENTICATION_INTERVAL = 86400000;

module.exports = {
    pollFavoriteBusinesses
};

function pollFavoriteBusinesses(){
    const pollingIntervalInMs = getInterval('api.pollingIntervalInMs', MINIMAL_POLLING_INTERVAL);
    const authenticationIntervalInMs = getInterval('api.authenticationIntervalInMS', MINIMAL_AUTHENTICATION_INTERVAL);

    const authentication$ = interval(authenticationIntervalInMs).pipe(
        startWith(0),
        flatMap(() => from(api.login()).pipe(
            retry(2),
            catchError(logError),
            filter(authentication => !!authentication)
        ))
    );

    return interval(pollingIntervalInMs).pipe(
        startWith(0),
        withLatestFrom(authentication$),
        flatMap(() => from(api.listFavoriteBusinesses()).pipe(
            retry(2),
            catchError(logError),
            filter(response => !!_.get(response, 'items')),
            map(response => response.items)
        ))
    );
}

function logError(error){
    console.error(error);
    return null;
}

function getInterval(configPath, minimumIntervalInMs){
    const configuredIntervalInMs = config.get(configPath);
    return _.isFinite(configuredIntervalInMs) ?
        Math.max(configuredIntervalInMs, minimumIntervalInMs) :
        minimumIntervalInMs;
}
