const _ = require('lodash');
const Telegraf = require('telegraf');
const extra = require('telegraf/extra');
//const markup = extra.markdown();
const markup = extra.HTML();
const { config } = require('./config');
const cache = {};
let bot;
let PausedChats = [];

module.exports = {
    notify
};

function notify(message){
    cache.message = message;
    if(!bot){
        createBot();
    }
    const chats = config.get('notifications.telegram.chats').filter(chat => PausedChats.indexOf(chat.id) == -1);
    _.forEach(chats, chat => sendMessage(chat.id, message));
}

function sendMessage(chatId, message){
    return bot.telegram
        .sendMessage(chatId, message, markup)
        .catch(error => {
            if(error.code === 403){
                removeChat(chatId);
            } else {
                console.error(`${error.code} - ${error.description}`);
            }
        });
}

function createBot(){
    const options = config.get('notifications.telegram');
    if(!options.enabled || !options.botToken){
        return null;
    }
    bot = new Telegraf(options.botToken);
    bot.command('start', startCommand);
    bot.command('stop', stopCommand);
    bot.command('pause', pauseCommand);
    bot.command('nottoday', pauseCommand);
    bot.command('help', helpCommand);
    bot.launch();
    return bot;
}

function startCommand(context){
    addChat(context);
    context.reply(`Hello, I am your TooGoodToGo bot.
I will notify you whenever your favorite food is up for grab.
Read how to control me by sending:
/help`);
    if(cache.message){
        context.reply(cache.message, markup);
    }
}

function stopCommand(context){
    context.reply(`OK... I'll stop notifying you now.
You can enable me again with:
/start`);
    removeChat(context.chat.id);
}

function pauseCommand(context){
    context.reply(`OK... I'll go to bed for today.
See you tomorrow :)`);
    PausedChats.push(context.chat.id);
}

function helpCommand(context){
    context.reply(`Hello, I am your TooGoodToGo bot.
I will let you know whenever your favorite stores have food to grab.
You can control me with:
<b>/start</b> to have me notify you
<b>/pause</b> to pause notifications for today
<b>/stop</b> to stop notifications until you re /start me`, markup);
}

function addChat(context){
    const chats = config.get('notifications.telegram.chats');
    const chat = {
        id: context.chat.id,
        firstName: context.from.first_name,
        lastName: context.from.last_name
    };
    PausedChats = PausedChats.filter(chat => chat !== context.chat.id);
    config.set('notifications.telegram.chats', _.unionBy(chats, [chat], chat => chat.id));
    console.log(`Added chat ${chat.firstName} ${chat.lastName} (${chat.id})`);
}

function removeChat(chatId){
    const chats = config.get('notifications.telegram.chats');
    const chat = _.find(chats, { id: chatId });
    if(chat){
        config.set('notifications.telegram.chats', _.pull(chats, chat));
        console.log(`Removed chat ${chat.firstName} ${chat.lastName} (${chat.id})`);
    }
}
