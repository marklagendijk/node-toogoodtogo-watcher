const { from, interval } = require('rxjs');
const { flatMap, startWith, filter, map } = require('rxjs/operators');
const { config } = require('./config');
const api = require('./api');

module.exports = {
    pollFavoriteBusinesses
}

function pollFavoriteBusinesses(){
    const intervalInMs = config.get('api.intervalInMs');
    return from(api.login()).pipe(
        flatMap(() => interval(intervalInMs).pipe(startWith(0))),
        flatMap(() => api.listFavoriteBusinesses()),
        filter(response => response.info),
        map(response => response.info)
    );
}