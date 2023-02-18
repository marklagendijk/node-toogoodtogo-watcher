import got from "got";
import { config } from "./config.js";

const api = got.extend({
  prefixUrl: config.get("notifications.gotify.url"),
});

export function notifyGotify(textMessage) {
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
