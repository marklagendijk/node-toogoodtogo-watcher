const got = require("got");
const { config } = require("./config");

const api = got.extend({
  prefixUrl: config.get("notifications.gotify.url"),
});

module.exports = {
  notifyGotify,
};

function notifyGotify(textMessage) {
  api.post(`message?token=${config.get("notifications.gotify.apptoken")}`, {
    json: {
      title: "TooGoodToGo Watcher",
      message: textMessage,
      priority: config.get("notifications.gotify.priority"),
      extras: {
        "client::notification": {
          click: { url: "https://share.toogoodtogo.com/" },
        },
      },
    },
  });
}
