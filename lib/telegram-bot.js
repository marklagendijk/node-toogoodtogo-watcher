const _ = require("lodash");
const Telegraf = require("telegraf");
const { config } = require("./config");
const { BehaviorSubject } = require("rxjs");
const { map, distinctUntilChanged } = require("rxjs/operators");
const moment = require("moment-timezone");
//const { listFavoriteBusinessesTelegram } = require("./poller");

const numberOfActiveChats$ = new BehaviorSubject(getNumberOfActiveChats());
const cache = {};
const bot = createBot();

module.exports = {
  hasActiveChats$,
  notify,
};

function hasActiveChats$() {
  return numberOfActiveChats$.pipe(
    map((numberOfActiveChats) => numberOfActiveChats > 0 && isEnabled()),
    distinctUntilChanged()
  );
}


function getDateString(inputDate) {
  return inputDate.calendar(null, {
    lastDay: "[Yesterday] HH:mm",
    sameDay: "[Today] HH:mm",
    nextDay: "[Tomorrow] HH:mm",
    lastWeek: "[Last Week] dddd HH:mm",
    nextWeek: "dddd HH:mm",
    sameElse: "L",
  });
}

function formatInterval(business) {
  if (business.pickup_interval) {
    const startDate = moment(
      new Date(Date.parse(business.pickup_interval.start))
    );
    const startDateTZ = startDate.tz("Europe/Rome");

    const endDate = moment(new Date(Date.parse(business.pickup_interval.end)));
    const endDateTZ = endDate.tz("Europe/Rome");

    return `${getDateString(startDateTZ)} - ${getDateString(endDateTZ)}`;
  }
  return "?";
}


function formatMessage(businesses) {
  return businesses
    .map(
      (business) =>
        `<a href="https://share.toogoodtogo.com/item/${
          business.item.item_id
        }">🍽 ${business.display_name}</a>
🥡 ${business.items_available}
⏰ ${formatInterval(business)}

`
    )
    .join("\n");
}

function notify(businesses) {
  const message = formatMessage(businesses);
  cache.message = message;

  const chats = getChats();
  _.forEach(chats, (chat) => sendMessage(chat.id, message));
}

function sendMessage(chatId, message) {
  return bot.telegram
    .sendMessage(chatId, message, {
      parse_mode: "html",
      disable_web_page_preview: true,
    })
    .catch((error) => {
      if (error.code === 403) {
        removeChat(chatId);
      } else {
        console.error(`[Telegram] ${error.code} - ${error.description}`);
      }
    });
}

function createBot() {
  const botToken = getBotToken();
  if (!isEnabled() || !botToken) {
    return null;
  }
  const bot = new Telegraf(botToken);
  bot.command("start", startCommand);
  bot.command("stop", stopCommand);
  bot.command("ping", pingCommand);
  //bot.command("favs", favsCommand);
  bot.launch();
  return bot;
}

function pingCommand(context) {
  context.reply(`Up and running!`);
}

function startCommand(context) {
  console.log("[Telegram] Received start command");

  addChat(context);
  context
    .reply(
      `*bleep* I am the TooGoodToGo bot.
I will tell you whenever the stock of your favorites changes. *bloop*.
If you get tired of my spamming you can (temporarily) disable me with:
/stop`
    )
    .then(() => {
      if (cache.message) {
        return sendMessage(context.chat.id, cache.message);
      }
    });
}

function stopCommand(context) {
  console.log("[Telegram] Received stop command");

  context.reply(`*bleep* Ok.. I get it. Too much is too much. I'll stop bothering you now. *bloop*.
You can enable me again with:
/start`);
  removeChat(context.chat.id);
}

/*
function favsCommand(context) {
  // TODO: put into notify and add contect flag
  console.log("[Telegram] Received favs command");
  addChat(context);

  try {
    const favBusinesses = listFavoriteBusinessesTelegram();
    console.log(favBusinesses);

    if (favBusinesses != "") {
      const message = formatMessage(favBusinesses);
      context.sendMessage(context.chat.id, message);
    } else {
      const message = "No boxes available right now";
      context.sendMessage(context.chat.id, message);
    }
  } catch (e) {
    console.log("Error while retrieving favs.");
    console.log(e);
    context.sendMessage("Not working :(");
  }
}
*/

function addChat(context) {
  const chats = getChats();
  const chat = {
    id: context.chat.id,
    firstName: context.from.first_name,
    lastName: context.from.last_name,
  };
  config.set(
    "notifications.telegram.chats",
    _.unionBy(chats, [chat], (chat) => chat.id)
  );
  console.log(`Added chat ${chat.firstName} ${chat.lastName} (${chat.id})`);
  emitNumberOfActiveChats();
}

function removeChat(chatId) {
  const chats = getChats();
  const chat = _.find(chats, { id: chatId });
  if (chat) {
    config.set("notifications.telegram.chats", _.pull(chats, chat));
    console.log(`Removed chat ${chat.firstName} ${chat.lastName} (${chat.id})`);
  }
  emitNumberOfActiveChats();
}

function emitNumberOfActiveChats() {
  numberOfActiveChats$.next(getNumberOfActiveChats());
}

function isEnabled() {
  return !!config.get("notifications.telegram.enabled");
}

function getChats() {
  return config.get("notifications.telegram.chats");
}

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function getNumberOfActiveChats() {
  const chats = config.get("notifications.telegram.chats");
  return _.size(chats);
}
