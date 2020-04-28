const notifier = require('node-notifier');
const { config } = require('./config');
const telegramBot = require('./telegram-bot');
const cache = {};
const util = require('util')

module.exports = {
    notifyIfChanged
};

function notifyIfChanged(businesses) {
    const options = config.get('notifications');
    var message = createMessage(businesses,options);
    message = (!message)?'<i>no good TGTG grabs available right now</i>':message;
    if(options.console.enabled){
        notifyConsole(message.replace( /(<([^>]+)>)/ig, ''), options.console);
    }
    if(cache.message !== message){
        if(options.desktop.enabled){
            notifyDesktop(message.replace( /(<([^>]+)>)/ig, ''))
        }
        if(options.telegram.enabled){
            telegramBot.notify(message);
        }
        cache.message = message;
    }
}

function notifyConsole(message, options){
    let date_ob = new Date();
    if(options.clear){
        console.clear();
    }
    if(options.include_time) {
        console.log(date_ob.getHours()+':'+date_ob.getMinutes()+':'+date_ob.getSeconds()+'\n');
    }
    console.log(message + '\n');
}

function notifyDesktop(message){
    notifier.notify({ title: 'TooGoodToGo', message });
}

function createMessage(businesses,options){
    return businesses
        .filter(business => (business.items_available >= options.min_stock) )
        .map(business => (
			 (options.format==2)? `<b>${ business.display_name }</b> @ ${new Date(Date.parse(business.pickup_interval.start)).toLocaleTimeString('en-GB',business.store.store_time_zone).substring(0,5)}`
			:(options.format==3)? `<b>${ business.display_name }</b> [${business.item.price.minor_units / (10 ** business.item.price.decimals)} ${business.item.price.code}]`
			:(options.format==4)? `<b>${ business.display_name }</b> <code>[${business.item.price.minor_units / (10 ** business.item.price.decimals)} ${business.item.price.code}]</code>  @ ${new Date(Date.parse(business.pickup_interval.start)).toLocaleTimeString('en-GB',business.store.store_time_zone).substring(0,5)}`
			:`<b>${ business.display_name }</b> : ${business.items_available}`
		))
           .join('\n');
}

