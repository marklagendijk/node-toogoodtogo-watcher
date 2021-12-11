const _ = require("lodash");
const { Telegraf } = require("telegraf");
const { config } = require("./config");
const api = require("./api");
const { BehaviorSubject } = require("rxjs");
const { map, distinctUntilChanged } = require("rxjs/operators");
const moment = require("moment-timezone");
//const { listFavoriteBusinessesTelegram } = require("./poller");

const numberOfActiveChats$ = new BehaviorSubject(getNumberOfActiveChats());
const cache = {};
const bot = createBot();
const botCommands = [
  {
    command: "start",
    description: "Activate bot.",
  },
  {
    command: "login",
    description: "Interactively login to your TooGoodToGo account.",
  },
  {
    command: "login_continue",
    description: "Continue login process after clicking the link.",
  },
  {
    command: "stop",
    description: "Deactivate bot.",
  },
  {
    command: "config",
    description: "Show current configuration.",
  },
];

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
  bot.command("login", loginCommand);
  bot.command("login_continue", loginContinueCommand);
  bot.command("stop", stopCommand);
  bot.command("ping", pingCommand);
  //bot.command("favs", favsCommand);
  bot.launch();
  return bot;
}

function pingCommand(context) {
  console.log("[Telegram] Received ping command.");
  context.reply("Up and running!");
}

function startCommand(context) {
  console.log("[Telegram] Received start command");

  addChat(context);
  context.telegram.setMyCommands(botCommands);
  context
    .reply(
      `🤗 I am the TooGoodToGo bot.
🚨 I will tell you whenever the stock of your favorites changes.
To login into your TooGoodToGo account run:
/login
Or with a new email address:
/login email@example.com

If you get tired of my spamming you can (temporarily) disable me with:
/stop`
    )
    .then(() => {
      if (cache.message) {
        return sendMessage(context.chat.id, cache.message);
      }
    });
}

async function loginCommand(context) {
  const textParts = context.update.message.text.split(" ");
  const email = textParts.length > 1 ? textParts[1].trim() : null;

  if (email) {
    config.set("api.credentials.email", email);
    context.reply(`Will start the login process with the specified email address: ${email}.
Open the login email on your PC and click the link.
Don't open the email on a phone that has the TooGoodToGo app installed. That won't work.
When you clicked the link run:
/login_continue
    `);
  } else {
    context.reply(
      `Will login with your currently configured email address.
To login with another email address use:
 /login email@example.com
 
Open the login email on your PC and click the link.
Don't open the email on a phone that has the TooGoodToGo app installed. That won't work.
When you clicked the link run:
/login_continue`
    );
  }

  try {
    console.log("Logging in... Please click on the login email.")
    const authResponse = await api.authByEmail();
    cache.loginPollingId = authResponse.polling_id;
    if (!authResponse.polling_id) {
      context.reply("Did not get a polling_id");
    }
  } catch (error) {
    context.reply(
      "Something went wrong\n" + JSON.stringify(error.stack, null, 4)
    );
  }
}

async function loginContinueCommand(context) {
  const authPollingResponse = await api.authPoll(cache.loginPollingId);
  if (!authPollingResponse) {
    context.reply("Did not get an access token");
    return;
  }
  console.log("Login successful.")
  context.reply("You are now successfully logged in!");
}

function stopCommand(context) {
  console.log("[Telegram] Received stop command");

  context.reply(`😬 Ok.. I get it. Too much is too much. I'll stop bothering you now. 😴
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

function setOption(option) {
  const activate = config.get("messageFilter." + option);
  config.set("messageFilter." + option, !activate);
  return !activate;
}

function getConfig() {
  const messageFilter = config.get("messageFilter");
  const bot = config.get("notifications.telegram.enabled");
  return { messageFilter, bot };
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
