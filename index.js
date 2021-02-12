#!/usr/bin/env node
const notifier = require("./lib/notifier");
const { pollFavoriteBusinesses$ } = require("./lib/poller");
const {
  editConfig,
  resetConfig,
  configPath,
  customConfig,
} = require("./lib/config");

const argv = require("yargs")
  .usage("Usage: toogoodtogo-watcher <command>")
  .env("TOOGOODTOGO")
  .command("config", "Edit the config file.")
  .command("config-reset", "Reset the config to the default values.")
  .command("config-path", "Show the path of the config file.")
  .command("watch", "Watch your favourite businesses for changes.", (yargs) => {
    return yargs.option("configFile", {
      alias: "cf",
      usage: "Specify custom config file content.",
    });
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

  case "watch":
    if (argv.configFile != null) {
      customConfig(argv.configFile);
    }

    pollFavoriteBusinesses$(notifier.hasListeners$()).subscribe(
      (businesses) => notifier.notifyIfChanged(businesses),
      console.error
    );
    break;
}
