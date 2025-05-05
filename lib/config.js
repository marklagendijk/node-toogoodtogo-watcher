import Conf from "conf";
import editor from "editor";
import { readFileSync } from "fs";

const defaults = JSON.parse(
  readFileSync(new URL("../config.defaults.json", import.meta.url), "utf-8"),
);

export const config = new Conf({
  defaults,
  projectName: "toogoodtogo-watcher",
});

export function editConfig() {
  editor(config.path);
  console.log(`Saved config at:  ${config.path}`);
}

export function resetConfig() {
  config.set(defaults);
}

export function configPath() {
  console.log(`The config is stored at: ${config.path}`);
}
