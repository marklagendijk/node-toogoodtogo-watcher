#!/usr/bin/env node
import { hasListeners$, notifyIfChanged } from "./lib/notifier.js";
import { consoleLogin } from "./lib/console-login.js";
import { pollFavoriteBusinesses$ } from "./lib/poller.js";
import { editConfig, resetConfig, configPath, config } from "./lib/config.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createTelegramBot } from "./lib/telegram-bot.js";

const argv = yargs(hideBin(process.argv))
  .usage("Usage: toogoodtogo-watcher <command>")
  .env("TOOGOODTOGO")
  .command("config", "Edit the config file.")
  .command("config-reset", "Reset the config to the default values.")
  .command("config-path", "Show the path of the config file.")
  .command("login", "Interactively login via a login email.", {
    email: {
      type: "string",
      describe:
        "The email address to login with. If not specified the configured email address will be used.",
    },
  })
  .command("watch", "Watch your favourite businesses for changes.", {
    config: {
      type: "string",
      describe:
        "Custom config. Note: the config will be overwrite the current config file.",
    },
  })
  .demandCommand().argv;

switch (argv._[0]) {
  case "config":
    editConfig();
    break;

  case "config-reset":
    resetConfig();
    break;

  case "config-path":
    configPath();
    break;

  case "login":
    if (argv.email) {
      config.set("api.credentials.email", argv.email);
    }
    await consoleLogin();
    break;

  case "watch":
    if (argv.config) {
      const customConfig = JSON.parse(argv.config);
      config.set(customConfig);
    }

    await createTelegramBot();
    pollFavoriteBusinesses$(hasListeners$()).subscribe({
      next: (businesses) => notifyIfChanged(businesses),
      error: console.error,
    });
    break;
}
