import _ from "lodash";
import { combineLatest, from, of, timer } from "rxjs";
import { catchError, filter, map, mergeMap, retry } from "rxjs/operators";
import { config } from "./config.js";
import {
  login,
  listFavoriteBusinesses,
  updateAppVersion,
} from "./toogoodtogo-api.js";

const MINIMAL_POLLING_INTERVAL = 15000;
const MINIMAL_AUTHENTICATION_INTERVAL = 3600000;
const APP_VERSION_REFRESH_INTERVAL = 86400000;

export function pollFavoriteBusinesses$(enabled$) {
  const pollingIntervalInMs = getInterval(
    "api.pollingIntervalInMs",
    MINIMAL_POLLING_INTERVAL,
  );

  return combineLatest([
    enabled$,
    timer(0, pollingIntervalInMs),
    authenticateByInterval$(),
    updateAppVersionByInterval$(),
  ]).pipe(
    filter(([enabled]) => enabled),
    mergeMap(() =>
      from(listFavoriteBusinesses()).pipe(
        retry(2),
        catchError(logError),
        filter((response) => !!_.get(response, "items")),
        map((response) => response.items),
      ),
    ),
  );
}

function authenticateByInterval$() {
  const authenticationIntervalInMs = getInterval(
    "api.authenticationIntervalInMS",
    MINIMAL_AUTHENTICATION_INTERVAL,
  );

  return timer(0, authenticationIntervalInMs).pipe(
    mergeMap(() =>
      from(login()).pipe(
        retry(2),
        catchError(logError),
        filter((authentication) => !!authentication),
      ),
    ),
  );
}

function updateAppVersionByInterval$() {
  return timer(0, APP_VERSION_REFRESH_INTERVAL).pipe(
    mergeMap(updateAppVersion),
  );
}

function logError(error) {
  if (error.options) {
    console.error(`Error during request:
${error.options.method} ${error.options.url.toString()}
${JSON.stringify(error.options.json, null, 4)}

${error.stack}`);
  } else if (error.stack) {
    console.error(error.stack);
  } else {
    console.error(error);
  }
  return of(null);
}

function getInterval(configPath, minimumIntervalInMs) {
  const configuredIntervalInMs = config.get(configPath);
  return _.isFinite(configuredIntervalInMs)
    ? Math.max(configuredIntervalInMs, minimumIntervalInMs)
    : minimumIntervalInMs;
}
