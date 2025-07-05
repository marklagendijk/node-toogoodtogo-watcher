import Conf from "conf";
import editor from "editor";
import { readFileSync } from "fs";
import _ from "lodash";

const defaults = JSON.parse(
  readFileSync(new URL("../config.defaults.json", import.meta.url), "utf-8"),
);

export const config = new Conf({
  defaults,
  projectName: "toogoodtogo-watcher",
  cwd: process.env.TOOGOODTOGO_CONFIG_DIR,
});

export function openConfigEditor() {
  editor(config.path);
  console.log(`Saved config at:  ${config.path}`);
}

export function resetConfig() {
  config.set(defaults);
}

export function setConfig(newConfig) {
  config.set(_.defaultsDeep(newConfig, defaults));
}

export function configPath() {
  console.log(`The config is stored at: ${config.path}`);
}
