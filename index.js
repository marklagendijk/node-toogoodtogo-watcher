const { flatMap } = require('rxjs/operators');
const { initConfig } = require('./lib/config');
const { pollFavoriteBusinesses } = require('./lib/poller');
const { notifyIfChanged } = require('./lib/notifier');

initConfig()
    .pipe(flatMap(() => pollFavoriteBusinesses()))
    .subscribe(businesses => notifyIfChanged(businesses))
