import _ from "lodash";
import { Telegraf } from "telegraf";
import { config } from "./config.js";
import { authByEmail, authPoll } from "./api.js";
import { BehaviorSubject } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";

const numberOfActiveChats$ = new BehaviorSubject(getNumberOfActiveChats());
const cache = {};
let bot;
const botCommands = [
  {
    command: "show_unchanged",
    description: "Activate alert for unchanged stock.",
  },
  {
    command: "show_decrease",
    description: "Activate alert for decreasing stock.",
  },
  {
    command: "show_decrease_to_zero",
    description: "Activate alert for sold out.",
  },
  {
    command: "show_increase",
    description: "Activate alert for increasing stock.",
  },
  {
    command: "show_increase_from_zero",
    description: "Activate alert for new market available.",
  },
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

export function hasActiveTelegramChats$() {
  return numberOfActiveChats$.pipe(
    map((numberOfActiveChats) => numberOfActiveChats > 0 && isEnabled()),
    distinctUntilChanged()
  );
}

export function notifyTelegram(message) {
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
        console.error(`${error.code} - ${error.description}`);
      }
    });
}

export function createTelegramBot() {
  const botToken = getBotToken();
  if (!isEnabled() || !botToken) {
    return null;
  }
  bot = new Telegraf(botToken);
  bot.command("start", startCommand);
  bot.command("login", loginCommand);
  bot.command("login_continue", loginContinueCommand);
  bot.command("stop", stopCommand);
  bot.command("config", configCommand);
  bot.command("show_unchanged", showUnchangedCommand);
  bot.command("show_decrease", showDecreaseCommand);
  bot.command("show_decrease_to_zero", showDecreaseToZeroCommand);
  bot.command("show_increase", showIncreaseCommand);
  bot.command("show_increase_from_zero", showIncreaseFromZeroCommand);

  bot.launch();

  return bot;
}

function startCommand(context) {
  addChat(context);
  context.telegram.setMyCommands(botCommands);
  context
    .reply(
      `👋 I am the TooGoodToGo bot.
🚨 I will tell you whenever the stock of your favorites changes.
To login into your TooGoodToGo account run:
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
  try {
    const textParts = context.update.message.text.split(" ");
    const email = textParts.length > 1 ? textParts[1].trim() : null;

    if (!email) {
      context.reply(`To login into your TooGoodToGo account run:
/login email@example.com`);
      return;
    }

    config.set("api.credentials.email", email);
    context.reply(
      `Will start the login process with the specified email address: ${email}.
Open the login email on your PC and click the link.
Don't open the email on a phone that has the TooGoodToGo app installed. That won't work.
When you clicked the link run:
/login_continue`
    );

    const authResponse = await authByEmail();
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
  const authPollingResponse = await authPoll(cache.loginPollingId);
  if (!authPollingResponse) {
    context.reply("Did not get an access token");
    return;
  }

  context.reply("You are now successfully logged in!");
}

function stopCommand(context) {
  context.reply(`😐 Ok.. I get it. Too much is too much. I'll stop bothering you now. 🤫.
You can enable me again with:
/start`);
  removeChat(context.chat.id);
}

function configCommand(context) {
  const config = getConfig();
  context.reply(`🔧 Of course !
Enabled : ${config.bot ? "✅" : "🚫"}
Activate alert for unchanged stock : ${
    config.messageFilter.showUnchanged ? "✅" : "🚫"
  }
Activate alert for decreasing stock : ${
    config.messageFilter.showDecrease ? "✅" : "🚫"
  }
Activate alert for sold out : ${
    config.messageFilter.showDecreaseToZero ? "✅" : "🚫"
  }
Activate alert for increasing stock : ${
    config.messageFilter.showIncrease ? "✅" : "🚫"
  }
Activate alert for new market available : ${
    config.messageFilter.showIncreaseFromZero ? "✅" : "🚫"
  }
  `);
}

function showUnchangedCommand(context) {
  const activate = setOption("showUnchanged");
  context.reply(
    (activate ? "✅" : "❌") +
      " Unchanged stock will" +
      (activate ? " " : " not ") +
      "be sent."
  );
}

function showDecreaseCommand(context) {
  const activate = setOption("showDecrease");
  context.reply(
    (activate ? "✅" : "❌") +
      " Decreasing stock will" +
      (activate ? " " : " not ") +
      "be sent."
  );
}

function showDecreaseToZeroCommand(context) {
  const activate = setOption("showDecreaseToZero");
  context.reply(
    (activate ? "✅" : "❌") +
      " Sold out will" +
      (activate ? " " : " not ") +
      "be sent."
  );
}

function showIncreaseCommand(context) {
  const activate = setOption("showIncrease");
  context.reply(
    (activate ? "✅" : "❌") +
      " Increasing stock will" +
      (activate ? " " : " not ") +
      "be sent."
  );
}

function showIncreaseFromZeroCommand(context) {
  const activate = setOption("showIncreaseFromZero");
  context.reply(
    (activate ? "✅" : "❌") +
      " New market available will" +
      (activate ? " " : " not ") +
      "be sent."
  );
}

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
  return config.get("notifications.telegram.botToken");
}

function getNumberOfActiveChats() {
  const chats = config.get("notifications.telegram.chats");
  return _.size(chats);
}
