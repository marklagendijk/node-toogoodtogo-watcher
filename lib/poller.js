const { from, interval, combineLatest } = require('rxjs');
const { mergeMap, startWith, filter, map } = require('rxjs/operators');
const api = require('./api');

module.exports = {
    pollFavoriteBusinesses
}

function pollFavoriteBusinesses({ intervalInMs, email, password }){
    return combineLatest(
        from(api.login({ email, password })),
        interval(intervalInMs).pipe(startWith(0)), 
    ).pipe(
        mergeMap(() => api.listFavoriteBusinesses()),
        filter(response => response.info),
        map(response => response.info)
    );
}