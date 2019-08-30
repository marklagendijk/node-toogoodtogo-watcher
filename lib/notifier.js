const notifier = require('node-notifier');
const { config } = require('./config');
const telegramBot = require('./telegram-bot');
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
        .filter(business => business.todays_stock > 0)
        .map(business => `${ business.business_name } - ${business.todays_stock}`)
        .join('\n');
}
