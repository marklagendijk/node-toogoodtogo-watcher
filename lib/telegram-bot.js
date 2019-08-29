const _ = require('lodash');
const Telegraf = require('telegraf')
const { config } = require('./config');
const cache = {};
let bot;

module.exports = {
    notify
};

function notify(message){
    cache.message = message;
    if(!bot){
        createBot();
    }
    const chats = config.get('notifications.telegram.chats');
    _.forEach(chats, chatId => bot.telegram.sendMessage(chatId, message));
}

function createBot(){
    const options = config.get('notifications.telegram');
    if(!options.enabled || !options.botToken){
        return null;
    }
    bot = new Telegraf(options.botToken);
    bot.command('start', startCommand);
    bot.command('stop', stopCommand);
    bot.launch();
    return bot;
}

function startCommand(context){
    addChat(context);
    context.reply(`*bleep* I am the TooGoodToGo bot.
I will tell you whenever the stock of your favorites changes. *bloop*.
If you get tired of my spamming you can (temporarily) disable me with:
/stop`)
    if(cache.message){
        context.reply(cache.message);
    }
}

function stopCommand(context){
    context.reply(`*bleep* Ok.. I get it. Too much is too much. I'll stop bothering you now. *bloop*.
You can enable me again with:
/start`)
    removeChat(context);
}

function addChat(context){
    const chats = config.get('notifications.telegram.chats');
    config.set('notifications.telegram.chats', _.union(chats, [context.chat.id]));
}

function removeChat(context){
    const chats = config.get('notifications.telegram.chats');
    config.set('notifications.telegram.chats', _.without(chats, context.chat.id));
}