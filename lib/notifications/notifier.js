import _ from "lodash";
import { combineLatest, of } from "rxjs";
import { map } from "rxjs/operators";
import { config } from "../config.js";
import { hasActiveTelegramChats$, notifyTelegram } from "./telegram-bot.js";
import { renderMessageByFormats } from "./message-renderer.js";
import { notifyConsole } from "./console-notifier.js";
import { notifyApprise } from "./apprise-notifier.js";
import { notifyDesktop } from "./desktop-notifier.js";
import { notifyMQTT } from "./homeassistant-mqtt.js";

const cache = { businessesById: {} };

export function hasListeners$() {
  return combineLatest([
    of(config.get("notifications.console.enabled")),
    of(config.get("notifications.desktop.enabled")),
    of(config.get("notifications.ifttt.enabled")),
    of(config.get("notifications.gotify.enabled")),
    of(config.get("notifications.mqtt.enabled")),
    hasActiveTelegramChats$(),
  ]).pipe(map((enabledItems) => _.some(enabledItems)));
}

export async function notifyIfChanged(businesses) {
  const businessesById = _.keyBy(businesses, "item.item_id");
  const filteredBusinesses = filterBusinesses(businessesById);
  const messageByFormats = renderMessageByFormats(filteredBusinesses);

  if (config.get("notifications.console.enabled")) {
    notifyConsole(messageByFormats.text);
  }

  if (filteredBusinesses.length > 0) {
    if (config.get("notifications.desktop.enabled")) {
      notifyDesktop(messageByFormats.text);
    }
    if (config.get("notifications.telegram.enabled")) {
      notifyTelegram(messageByFormats.html);
    }
    if (config.get("notifications.apprise.enabled")) {
      await notifyApprise(messageByFormats);
    }
    if (config.get("notifications.mqtt.enabled")) {
      notifyMQTT(messageByFormats.object);
    }
  }

  cache.businessesById = businessesById;
}

function filterBusinesses(businessesById) {
  return Object.keys(businessesById)
    .filter((key) => {
      const current = businessesById[key];
      const previous = cache.businessesById[key];
      return hasInterestingChange(current, previous);
    })
    .map((key) => businessesById[key]);
}

function hasInterestingChange(current, previous) {
  const options = config.get("messageFilter");

  const currentStock = current.items_available;
  const previousStock = previous ? previous.items_available : 0;

  if (currentStock === previousStock) {
    return options.showUnchanged;
  } else if (currentStock === 0) {
    return options.showDecreaseToZero;
  } else if (currentStock < previousStock) {
    return options.showDecrease;
  } else if (previousStock === 0) {
    return options.showIncreaseFromZero;
  } else {
    return options.showIncrease;
  }
}
