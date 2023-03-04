import _ from "lodash";
import got from "got";
import { config } from "../config.js";

const options = config.get("notifications.apprise") || {};
const servicesUrlsByFormat = _.chain(options.services || [])
  .groupBy("format")
  .mapValues((services) => _.map(services, "url"))
  .value();

export async function notifyApprise(messageByFormats) {
  return Promise.all(
    _.map(servicesUrlsByFormat, (urls, format) =>
      executeNotificationRequest(urls, format, messageByFormats[format])
    )
  );
}

async function executeNotificationRequest(urls, format, body) {
  if (!urls.length) {
    return;
  }

  try {
    return got.post(`http://${options.host}/notify/`, {
      json: {
        urls,
        format,
        body,
      },
    });
  } catch (error) {
    console.error(`Error when trying to send notification via Apprise:
${error.response.statusCode} (${error.response.statusMessage})
${error.response.body}`);
  }
}
