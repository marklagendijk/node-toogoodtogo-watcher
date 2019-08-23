const notifier = require('node-notifier');
const cache = {};

module.exports = {
    notifyIfChanged
};

function notifyIfChanged(businesses) {
    const message = createMessage(businesses);
    console.clear();
    console.log(message + '\n');
    if(cache.message !== message){
        notifier.notify({ title: 'TooGoodToGo', message });
        cache.message = message;
    }
}

function createMessage(businesses){
    return businesses
        .map(business => `${ business.business_name } - ${business.todays_stock}`)
        .join('\n');
}