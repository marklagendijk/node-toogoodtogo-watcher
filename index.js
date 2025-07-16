#!/usr/bin/env node
import {
  hasListeners$,
  notifyIfChanged,
} from "./lib/notifications/notifier.js";
import { consoleLogin } from "./lib/console-login.js";
import { pollFavoriteBusinesses$ } from "./lib/poller.js";
import {
  openConfigEditor,
  resetConfig,
  configPath,
  setConfig,
  config,
} from "./lib/config.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createTelegramBot } from "./lib/notifications/telegram-bot.js";
import { createMqttConnection } from "./lib/notifications/homeassistant-mqtt.js";

const argv = yargs(hideBin(process.argv))
  .usage("Usage: toogoodtogo-watcher <command>")
  .env("TOOGOODTOGO")
  .command("config", "Open the config file in your default editor.")
  .command("config-set", "Set configuration options.", {
    config: {
      type: "string",
      demandOption: true,
      describe:
        "Configuration options to override, in json format. You can use (a subset of) config.defaults.json as template.",
    },
  })
  .command("config-reset", "Reset the config to the default values.")
  .command("config-path", "Show the path of the config file.")
  .command("login", "Interactively login via a login email.", {
    email: {
      type: "string",
      demandOption: true,
      describe: "The email address to login with.",
    },
  })
  .command("watch", "Watch your favourite businesses for changes.", {
    config: {
      type: "string",
      describe: "Configuration options to override, in json format",
    },
  })
  .demandCommand().argv;

switch (argv._[0]) {
  case "config":
    openConfigEditor();
    break;

  case "config-set":
    setConfig(JSON.parse(argv.config));
    break;

  case "config-reset":
    resetConfig();
    break;

  case "config-path":
    configPath();
    break;

  case "login":
    config.set("api.credentials.email", argv.email);
    await consoleLogin();
    break;

  case "watch":
    if (argv.config) {
      setConfig(JSON.parse(argv.config));
    }

    await createTelegramBot();
    createMqttConnection();

    pollFavoriteBusinesses$(hasListeners$()).subscribe({
      next: (businesses) => notifyIfChanged(businesses),
      error: console.error,
    });
    break;
}
