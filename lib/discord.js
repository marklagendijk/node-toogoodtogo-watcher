const got = require("got");
const { config } = require("./config");

module.exports = {
  notifyDiscord,
};

function notifyDiscord(textMessage) {
  got.post(config.get("notifications.discord.webhook"), {
    json: {
      username: "TooGoodToGo Watcher",
      content: textMessage,
    },
  });
}
