const _ = require("lodash");
const Telegraf = require("telegraf");
const { config } = require("./config");
const { BehaviorSubject } = require("rxjs");
const { map, distinctUntilChanged } = require("rxjs/operators");

const numberOfActiveChats$ = new BehaviorSubject(getNumberOfActiveChats());
const cache = {};
const bot = createBot();
const botCommands = [
  {
    command: "add_allowed_ids",
    description: "Add allowed chat ids",
  },
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

function notify(message) {
  cache.message = message;

  const chats = getChats();
  const allowedChats = getAllowedChats();
  _.forEach(
    chats,
    (chat) => allowedChats.has(chat.id) && sendMessage(chat.id, message)
  );
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

function createBot() {
  const botToken = getBotToken();
  if (!isEnabled() || !botToken) {
    return null;
  }
  const bot = new Telegraf(botToken);
  bot.command("start", startCommand);
  bot.command("stop", stopCommand);
  bot.command("config", configCommand);
  bot.command("add_allowed_ids", addAllowedChatCommand);
  bot.command("show_unchanged", showUnchangedCommand);
  bot.command("show_decrease", showDecreaseCommand);
  bot.command("show_decrease_to_zero", showDecreaseToZeroCommand);
  bot.command("show_increase", showIncreaseCommand);
  bot.command("show_increase_from_zero", showIncreaseFromZeroCommand);
  bot.launch();
  return bot;
}

function startCommand(context) {
  if (isRestricted()) {
    if (getNumberOfAllowedChats() == 0 && getNumberOfActiveChats() == 0) {
      addAllowedChats(context.message.from.id);
    } else if (!getAllowedChats().has(context.message.from.id)) {
      return context.reply(`👋 I am the TooGoodToGo bot.
			I'm sorry but this bot is running in restriced mode and this Telegram account isn't allowed.`);
    }
  }

  addChat(context);
  context.telegram.setMyCommands(botCommands);
  context
    .reply(
      `👋 I am the TooGoodToGo bot.
🚨 I will tell you whenever the stock of your favorites changes.
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
  context.reply(`😐 Ok.. I get it. Too much is too much. I'll stop bothering you now. 🤫.
You can enable me again with:
/start`);
  removeChat(context.chat.id);
}

function configCommand(context) {
  const config = getConfig();
  context.reply(`🔧 Of course !
Enabled : ${config.bot ? "✅" : "🚫"}
Restricted : ${isRestricted() ? "✅" : "🚫"}
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

function addAllowedChatCommand(context) {
  if (!isRestricted()) {
    return context.reply("This command only works in restricted mode");
  } else if (!getAllowedChats().has(context.message.from.id)) {
    return context.reply(`Command restricted to allowed chats`);
  }
  let ids = context.update.message.text.split(" ").slice(1);
  if (ids.length === 0) {
    return context.reply(`Usage /add_allowed_ids [<ID1> <ID2> ...]`);
  }
  let promises = [];
  ids.forEach((id) => {
    promises.push(
      new Promise((resolve, reject) => {
        context.tg
          .getChat(id)
          .then(resolve)
          .catch(() => reject(id));
      })
    );
  });
  Promise.allSettled(promises).then((data) => {
    let resolved = [];
    let rejected = [];
    data.forEach((item) => {
      if (item.status === "fulfilled") {
        resolved.push(item.value.id);
      } else if (item.status === "rejected") {
        rejected.push(item.reason);
      }
    });
    let msg = [];
    if (resolved.length > 0) {
      addAllowedChats(resolved);
      msg.push(`Succesfully allowed IDs ${resolved.join(",")}`);
    }
    if (rejected.length > 0) {
      msg.push(
        `Some IDs (${rejected.join(
          ","
        )}) couldn't be added. Make sure they are valid Telegram IDs and that the user has already started a conversation with me.`
      );
    }
    context.reply(msg.join("\n"));
  });
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

function addAllowedChats(args) {
  let chats = getAllowedChats();
  let newChats = [].concat(args || []);
  console.log(`Allowed chats ${newChats.join(",")}`);
  newChats.forEach((id) => chats.add(id));
  config.set("notifications.telegram.allowedChatIDs", [...chats]);
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

function isRestricted() {
  return !!config.get("notifications.telegram.restricted");
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

function getAllowedChats() {
  return new Set(config.get("notifications.telegram.allowedChatIDs") || []);
}

function getNumberOfAllowedChats() {
  const chats = getAllowedChats();
  return _.size(chats);
}
