const _ = require('lodash');
const { from, of, interval } = require('rxjs');
const { flatMap, startWith, filter, map, withLatestFrom, retry, catchError } = require('rxjs/operators');
const { config } = require('./config');
const api = require('./api');

const MINIMAL_POLLING_INTERVAL = 15000;
const MINIMAL_AUTHENTICATION_INTERVAL = 3600000;

module.exports = {
    pollFavoriteBusinesses$
};

function pollFavoriteBusinesses$(enabled$){
    const authenticationByInterval$ = authenticateByInterval$();
    return listFavoriteBusinessesByInterval$(authenticationByInterval$, enabled$);
}

function authenticateByInterval$(){
    const authenticationIntervalInMs = getInterval('api.authenticationIntervalInMS', MINIMAL_AUTHENTICATION_INTERVAL);

    return interval(authenticationIntervalInMs).pipe(
        startWith(0),
        flatMap(() => from(api.login()).pipe(
            retry(2),
            catchError(logError),
            filter(authentication => !!authentication)
        ))
    );
}

function listFavoriteBusinessesByInterval$(authenticationByInterval$, enabled$){
    const pollingIntervalInMs = getInterval('api.pollingIntervalInMs', MINIMAL_POLLING_INTERVAL);

    return interval(pollingIntervalInMs).pipe(
        startWith(0),
        withLatestFrom(enabled$),
        filter(([_, enabled]) => enabled),
        withLatestFrom(authenticationByInterval$),
        flatMap(() => from(api.listFavoriteBusinesses()).pipe(
            retry(2),
            catchError(logError),
            filter(response => !!_.get(response, 'items')),
            map(response => response.items)
        ))
    );
}

function logError(error){
    console.error(`Error ${_.get(error, 'statusCode')} during ${_.get(error, 'options.method')} ${_.get(error, 'options.baseUrl')}${_.get(error, 'options.url')}:
${JSON.stringify(_.get(error, 'response.body.errors'), null, 4)}`);
    return of(null);
}

function getInterval(configPath, minimumIntervalInMs){
    const configuredIntervalInMs = config.get(configPath);
    return _.isFinite(configuredIntervalInMs) ?
        Math.max(configuredIntervalInMs, minimumIntervalInMs) :
        minimumIntervalInMs;
}
