import notifier from "node-notifier";
import { config } from "./config.js";
import { hasActiveTelegramChats$, notifyTelegram } from "./telegram-bot.js";
import _ from "lodash";
import moment from "moment";
import { combineLatest, of } from "rxjs";
import { notifyGotify } from "./gotify.js";
import { notifyIFTTT } from "./ifttt.js";
import { map } from "rxjs/operators";

const cache = { businessesById: {} };

export function hasListeners$() {
  return combineLatest([
    of(config.get("notifications.console.enabled")),
    of(config.get("notifications.desktop.enabled")),
    of(config.get("notifications.ifttt.enabled")),
    of(config.get("notifications.gotify.enabled")),
    hasActiveTelegramChats$(),
  ]).pipe(map((enabledItems) => _.some(enabledItems)));
}

export function notifyIfChanged(businesses) {
  const businessesById = _.keyBy(businesses, "item.item_id");
  const filteredBusinesses = filterBusinesses(businessesById);
  const textMessage = createTextMessage(filteredBusinesses);
  const htmlMessage = createHtmlMessage(filteredBusinesses);

  if (config.get("notifications.console.enabled")) {
    notifyConsole(textMessage, config.get("notifications.console"));
  }

  if (filteredBusinesses.length > 0) {
    if (config.get("notifications.desktop.enabled")) {
      notifyDesktop(textMessage);
    }
    if (config.get("notifications.telegram.enabled")) {
      notifyTelegram(htmlMessage);
    }
    if (config.get("notifications.ifttt.enabled")) {
      notifyIFTTT(textMessage, htmlMessage);
    }
    if (config.get("notifications.gotify.enabled")) {
      notifyGotify(textMessage);
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

function notifyConsole(message, options) {
  if (options.clear) {
    console.clear();
  }
  console.log(message + "\n");
}

function notifyDesktop(message) {
  notifier.notify({ title: "TooGoodToGo", message });
}

function createTextMessage(businesses) {
  return businesses
    .map(
      (business) => `${business.display_name}
Price: ${business.item.price_including_taxes.minor_units / 100}
Quantity: ${business.items_available}
Pickup: ${formatInterval(business)}`
    )
    .join("\n\n");
}

function createHtmlMessage(businesses) {
  return businesses
    .map(
      (business) =>
        `<a href="https://share.toogoodtogo.com/item/${
          business.item.item_id
        }">🍽 ${business.display_name}</a>
💰 ${business.item.price_including_taxes.minor_units / 100}
🥡 ${business.items_available}
⏰ ${formatInterval(business)}`
    )
    .join("\n\n");
}

function formatInterval(business) {
  if (!business.pickup_interval) {
    return "?";
  }
  const startDate = formatDate(business.pickup_interval.start);
  const endDate = formatDate(business.pickup_interval.end);
  return `${startDate} - ${endDate}`;
}

function formatDate(dateString) {
  return moment(dateString).calendar(null, {
    lastDay: "[Yesterday] HH:mm",
    sameDay: "[Today] HH:mm",
    nextDay: "[Tomorrow] HH:mm",
    lastWeek: "[Last Week] dddd HH:mm",
    nextWeek: "dddd HH:mm",
    sameElse: "L",
  });
}
