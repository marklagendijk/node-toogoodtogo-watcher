const got = require("got");
const { config } = require("./config");

const api = got.extend({
  prefixUrl: "https://maker.ifttt.com/trigger",
});

module.exports = {
  notifyIFTTT,
};

function notifyIFTTT(message) {
  return api.post(
    `${config.get("notifications.ifttt.webhookEvent")}/with/key/${config.get(
      "notifications.ifttt.webhookKey"
    )}`,
    {
      json: {
        value1: message,
      },
    }
  );
}
