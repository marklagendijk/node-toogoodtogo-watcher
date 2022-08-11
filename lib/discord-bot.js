const got = require("got");
const { config } = require("./config");
  
  module.exports = {
    notifyDiscord,
  };
  
  function notifyDiscord(discordEmbed) {
    got.post(config.get("notifications.discord.webhook_url"),{
      json: discordEmbed,
    });
  }