const notifier = require('node-notifier');
const { config } = require('./config');
const telegramBot = require('./telegram-bot');
const { notifyIFTTT } = require('./ifttt');
const cache = {};

module.exports = {
    notifyIfChanged
};

function notifyIfChanged(businesses) {
    const message = createMessage(businesses);
    const options = config.get('notifications');
    if(options.console.enabled){
        notifyConsole(message, options.console);
    }
    if(cache.message !== message){
        if(options.desktop.enabled){
            notifyDesktop(message)
        }
        if(options.telegram.enabled){
            telegramBot.notify(message);
        }
        if(options.ifttt.enabled) {
            notifyIFTTT();
        }
        cache.message = message;
    }
}

function notifyConsole(message, options){
    if(options.clear){
        console.clear();
    }
    console.log(message + '\n');
}

function notifyDesktop(message){
    notifier.notify({ title: 'TooGoodToGo', message });
}

function createMessage(businesses){
    return businesses
        .map(business => `${ business.display_name } - ${business.items_available}`)
        .join('\n');
}
