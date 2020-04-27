const _ = require('lodash');
const Telegraf = require('telegraf');
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
        .sendMessage(chatId, message)
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
    bot.launch();
    return bot;
}

function startCommand(context){
    addChat(context);
    context.reply(`*bleep* I am the TooGoodToGo bot.
I will tell you whenever the stock of your favorites changes. *bloop*.
If you get tired of my spamming you can (temporarily) disable me with:
/stop or /pause`);
    if(cache.message){
        context.reply(cache.message);
    }
}

function stopCommand(context){
    context.reply(`*bleep* Ok.. I get it. Too much is too much. I'll stop bothering you now. *bloop*.
You can enable me again with:
/start`);
    removeChat(context.chat.id);
}

function pauseCommand(context){
    context.reply(`OK... I'll go to bed for today.
See you tomorrow :)`);
    PausedChats.push(context.chat.id);
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
