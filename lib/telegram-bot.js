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
    bot.launch();
    return bot;
}

function startCommand(context){
    addChat(context);
    context.reply('Hi there! The watcher can now send you Telegram chat notifications!')
    if(cache.message){
        notify(cache.message);
    }
}

function addChat(context){
    const chats = config.get('notifications.telegram.chats');
    config.set('notifications.telegram.chats', _.union(chats, [context.chat.id]));
}
