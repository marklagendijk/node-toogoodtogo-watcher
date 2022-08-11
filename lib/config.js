const Conf = require("conf");
const editor = require("editor");
const defaults = require("../config.defaults.json");

const config = new Conf({
  defaults,
  projectName: "toogoodtogo-watcher",
});

module.exports = {
  config,
  editConfig,
  injectOSEnvToConfig,
  resetConfig,
  configPath,
};

function editConfig() {
    editor(config.path);
    console.log(`Saved config at:  ${config.path}`);
}

function injectOSEnvToConfig() {
  config.set("api.credentials.email", process.env.email);
  config.set("api.session", {
      userId: process.env.user_id,
      accessToken: process.env.access_token,
      refreshToken: process.env.refresh_token,
    });
  config.set("api.notifications",{
    console: {
      enabled: process.env.console_enable,
      clear: process.env.console_clear
    },
    telegram: {
      enabled: process.env.telegram_enable,
      botToken: process.env.telegram_token,
      chats: [`${process.env.telegram_chats}`]
    },
    ifttt: {
      enabled: process.env.ifttt_enable,
      webhookKey: process.env.ifttt_token,
      webhookEvents: [`${process.env.ifttt_events}`]
    },
    discord: {
      enabled: process.env.discord_enable,
      webhook_url: process.env.discord_webhook_url
    },
    gotify: {
      enabled: process.env.gotify_enable,
      url: process.env.gotify_url,
      apptoken: process.env.gotify_token,
      priority: process.env.gotify_priority
    }
  })
  return 0;
}
function resetConfig() {
  config.set(defaults);
}

function configPath() {
  console.log(`The config is stored at: ${config.path}`);
}
