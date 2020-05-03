const _ = require('lodash');
const { interval } = require('rxjs');
const { iif, from, of } = require('rxjs');
const { mergeMap, flatMap, startWith, filter, map, withLatestFrom, retry, catchError } = require('rxjs/operators');
const { config } = require('./config');
const api = require('./api');
const telegramBot = require('./telegram-bot');

const MINIMAL_POLLING_INTERVAL = 15000;
const MINIMAL_AUTHENTICATION_INTERVAL = 3600000;

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

    if (pausePolling()) {console.log('Your TooGoodToGo watcher is currently disabled because you enabled the Telegram bot in your config but the bot is not registered to any chat.\nPolling of TooTooGoodToGo will start once a chat is registered.');}

    return interval(pollingIntervalInMs).pipe(
        mergeMap(v =>
        iif(
            () =>  !pausePolling(),
                   of(v),
            )
        ),
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

function pausePolling() {
    const options = config.get('notifications.telegram');
	const chats = (!!(options.chats.length))?options.chats.filter(chat => telegramBot.PausedChats.indexOf(chat.id)== -1):[];
	if (options.enabled && !(chats.length) ) {
		telegramBot.createBot();
		telegramBot.cache.message='';
		}
    return (options.enabled && !(chats.length) );
}
