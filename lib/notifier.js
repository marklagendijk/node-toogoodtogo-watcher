const notifier = require('node-notifier');
const cache = {};

module.exports = {
    notifyIfChanged
};

function notifyIfChanged(message) {
    if(cache.message !== message){
        notifier.notify({ title: 'TooGoodToGo', message });
        cache.message = message;
    }
}