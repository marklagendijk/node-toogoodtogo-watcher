const notifier = require('node-notifier');
const cache = {};

module.exports = {
    notifyIfChanged
};

function notifyIfChanged(businesses) {
    const message = createMessage(businesses);
    if(cache.message !== message){
        notifier.notify({ title: 'TooGoodToGo', message });
        cache.message = message;
    }
}

function createMessage(businesses){
    businesses
        .map(business => `${ business.business_name } - ${business.todays_stock}`)
        .join('\n');
}