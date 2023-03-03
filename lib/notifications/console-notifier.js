import { config } from "../config.js";

const options = config.get("notifications.console");

export function notifyConsole(message) {
  if (options.clear) {
    console.clear();
  }
  console.log(message + "\n");
}
