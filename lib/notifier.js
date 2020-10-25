const notifier = require("node-notifier");
const { config } = require("./config");
const telegramBot = require("./telegram-bot");
const _ = require("lodash");
const { of, combineLatest } = require("rxjs");
const { map } = require("rxjs/operators");

const cache = { businessesById: {} };

module.exports = {
  hasListeners$,
  notifyIfChanged,
};

function hasListeners$() {
  const options = config.get("notifications");
  return combineLatest(
    of(options.console.enabled),
    of(options.desktop.enabled),
    telegramBot.hasActiveChats$()
  ).pipe(map((enabledItems) => _.some(enabledItems)));
}

function notifyIfChanged(businesses) {
  const businessesById = _.keyBy(businesses, "item.item_id");
  const filteredBusinesses = filterBusinesses(businessesById);

  const message = createMessage(filteredBusinesses);
  const options = config.get("notifications");

  if (options.console.enabled) {
    notifyConsole(message, options.console);
  }
  if (filteredBusinesses.length > 0) {
    if (options.desktop.enabled) {
      notifyDesktop(message);
    }
    if (options.telegram.enabled) {
      telegramBot.notify(message);
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

function createMessage(businesses) {
  return businesses
    .map((business) => `${business.display_name} - ${business.items_available}`)
    .join("\n");
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
