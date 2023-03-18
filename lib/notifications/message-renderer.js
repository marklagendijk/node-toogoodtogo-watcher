﻿import moment from "moment";

export function renderMessageByFormats(businesses) {
  return {
    html: renderHtmlMessage(businesses),
    text: renderTextMessage(businesses),
  };
}

function renderTextMessage(businesses) {
  return businesses
    .map(
      (business) => `${business.display_name}
Price: ${business.item.price_including_taxes.minor_units / 100}
Quantity: ${business.items_available}
Pickup: ${formatInterval(business)}`
    )
    .join("\n\n");
}

function renderHtmlMessage(businesses) {
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

export function formatInterval(business) {
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
